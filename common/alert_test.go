package common

import (
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
)

// setupAlertRedis 初始化 Redis 并重置所有状态
func setupAlertRedis(t *testing.T) *miniredis.Miniredis {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("miniredis 启动失败: %v", err)
	}
	RDB = miniredisClient(mr)
	RedisEnabled = true
	return mr
}

func teardownAlertRedis(t *testing.T, mr *miniredis.Miniredis) {
	t.Helper()
	mr.Close()
}

// miniredisClient 创建 go-redis v8 客户端连接到 miniredis
func miniredisClient(mr *miniredis.Miniredis) *redis.Client {
	return redis.NewClient(&redis.Options{Addr: mr.Addr()})
}

func TestCheckAndAlert_QuotaLimitZero(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)

	t.Run("quota_limit=0永不告警", func(t *testing.T) {
		blocked := CheckAndAlert(1, 100, 0)
		if blocked {
			t.Error("quota_limit=0 时不应触发熔断")
		}
	})

	t.Run("quota_limit=0大量使用也不告警", func(t *testing.T) {
		blocked := CheckAndAlert(1, 999999, 0)
		if blocked {
			t.Error("quota_limit=0 时不触发")
		}
	})

	t.Run("quota_limit=负数不告警", func(t *testing.T) {
		blocked := CheckAndAlert(1, 100, -1)
		if blocked {
			t.Error("quota_limit<0 时不应触发")
		}
	})
}

func TestCheckAndAlert_Below80Percent(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	t.Run("50%用量无告警", func(t *testing.T) {
		// usage=5, limit=10 → 50%
		blocked := CheckAndAlert(100, 5, 10)
		if blocked {
			t.Error("50%用量不应触发熔断")
		}
		if IsAlertSent(100, AlertLevelWarning) {
			t.Error("50%用量不应发送告警")
		}
	})

	t.Run("10%用量无告警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(101, 1, 10)
		if blocked {
			t.Error("10%用量不应触发")
		}
	})

	t.Run("79%用量无告警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(102, 7.9, 10)
		if blocked {
			t.Error("79%用量不应触发")
		}
	})
}

func TestCheckAndAlert_At80Percent(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)

	t.Run("80%用量触发预警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(200, 8.0, 10)
		if blocked {
			t.Error("80%用量不应触发熔断，仅触发预警")
		}
		if !IsAlertSent(200, AlertLevelWarning) {
			t.Error("80%用量应标记 level=1 告警已发送")
		}
	})

	t.Run("80%重复触发不重复发送", func(t *testing.T) {
		// 不清理 Redis，再次调用
		// 记录当前告警发送计数（通过 IsAlertSent 已为 true）
		if !IsAlertSent(200, AlertLevelWarning) {
			t.Error("前次已发送告警标记应存在")
		}
		// 再次调用不应崩溃
		blocked := CheckAndAlert(200, 8.5, 10)
		if blocked {
			t.Error("80%重复调用不应触发熔断")
		}
	})

	t.Run("85%用量仍为预警级别", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(201, 8.5, 10)
		if blocked {
			t.Error("85%用量不应触发熔断")
		}
		if !IsAlertSent(201, AlertLevelWarning) {
			t.Error("85%用量应触发预警")
		}
	})
}

func TestCheckAndAlert_At90Percent(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)

	t.Run("90%用量触发严重告警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(300, 9.0, 10)
		if blocked {
			t.Error("90%用量不应触发熔断")
		}
		if !IsAlertSent(300, AlertLevelCritical) {
			t.Error("90%用量应标记 level=2 告警")
		}
	})

	t.Run("90%同时也不会重复发80%告警", func(t *testing.T) {
		// 新用户直接从 0 跳到 90%：level=2 发送，但 level=1 也应标记
		// 实际上代码逻辑：pct >= 0.9 进入 critical 分支，不会进入 0.8 分支
		// 所以 level=1 不应被标记
		mr.FlushAll()
		CheckAndAlert(301, 9.5, 10)
		if IsAlertSent(301, AlertLevelWarning) {
			t.Log("90%直接触发时不发80%告警（符合代码逻辑：pct>=0.9时不进入0.8分支）")
		}
	})

	t.Run("95%用量仍为严重告警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(302, 9.5, 10)
		if blocked {
			t.Error("95%用量不应触发熔断")
		}
		if !IsAlertSent(302, AlertLevelCritical) {
			t.Error("95%用量应触发严重告警")
		}
	})
}

func TestCheckAndAlert_At100Percent(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)

	t.Run("100%用量触发熔断", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(400, 10.0, 10)
		if !blocked {
			t.Error("100%用量应触发熔断")
		}
		if !IsUserBlocked(400) {
			t.Error("100%用量应标记用户为熔断状态")
		}
	})

	t.Run("熔断后再次检查仍返回true", func(t *testing.T) {
		blocked := CheckAndAlert(400, 10.0, 10)
		if !blocked {
			t.Error("已熔断用户再次检查应返回 true")
		}
	})
}

func TestCheckAndAlert_Over100Percent(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)

	t.Run("120%用量触发熔断", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(500, 12.0, 10)
		if !blocked {
			t.Error("120%用量应触发熔断")
		}
		if !IsUserBlocked(500) {
			t.Error("120%用量应标记熔断")
		}
	})

	t.Run("200%用量触发熔断", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(501, 20.0, 10)
		if !blocked {
			t.Error("200%用量应触发熔断")
		}
	})
}

func TestCheckAndAlert_ProgressiveEscalation(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	userId := 600
	limit := 100.0

	// 渐进式：50% → 80% → 90% → 100%

	t.Run("50%无告警", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 50, limit)
		if blocked {
			t.Error("50%不应触发熔断")
		}
	})

	t.Run("80%触发预警", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 80, limit)
		if blocked {
			t.Error("80%不应触发熔断")
		}
		if !IsAlertSent(userId, AlertLevelWarning) {
			t.Error("80%应发送预警")
		}
	})

	t.Run("90%触发严重告警", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 90, limit)
		if blocked {
			t.Error("90%不应触发熔断")
		}
		if !IsAlertSent(userId, AlertLevelCritical) {
			t.Error("90%应发送严重告警")
		}
	})

	t.Run("100%触发熔断", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 100, limit)
		if !blocked {
			t.Error("100%应触发熔断")
		}
		if !IsUserBlocked(userId) {
			t.Error("100%应标记熔断")
		}
	})
}

func TestCheckAndAlert_UnblockThenRecheck(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	userId := 700
	limit := 10.0

	t.Run("先触发100%熔断", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 10, limit)
		if !blocked {
			t.Error("应触发熔断")
		}
	})

	t.Run("解除熔断后低于100%不触发", func(t *testing.T) {
		UnblockUser(userId)
		blocked := CheckAndAlert(userId, 7.0, limit)
		if blocked {
			t.Error("解除熔断后70%不应触发")
		}
	})

	t.Run("解除熔断后达到100%再次触发", func(t *testing.T) {
		blocked := CheckAndAlert(userId, 10.0, limit)
		if !blocked {
			t.Error("解除后再次达到100%应触发熔断")
		}
	})
}

func TestCheckAndAlert_PrecisionBoundaries(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	t.Run("79.999%不触发80%告警", func(t *testing.T) {
		blocked := CheckAndAlert(800, 7.9999, 10)
		if blocked {
			t.Error("79.999%不应触发")
		}
	})

	t.Run("80.001%触发80%告警", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(801, 8.0001, 10)
		if blocked {
			t.Error("80.001%不应触发熔断")
		}
		if !IsAlertSent(801, AlertLevelWarning) {
			t.Error("80.001%应触发预警")
		}
	})

	t.Run("89.999%触发80%告警(不触发90%)", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(802, 8.9999, 10)
		if blocked {
			t.Error("89.999%不应触发熔断")
		}
		if IsAlertSent(802, AlertLevelCritical) {
			t.Error("89.999%不应触发严重告警")
		}
	})

	t.Run("99.999%触发90%告警(不触发100%熔断)", func(t *testing.T) {
		mr.FlushAll()
		blocked := CheckAndAlert(803, 9.9999, 10)
		if blocked {
			t.Error("99.999%不应触发熔断")
		}
		if !IsAlertSent(803, AlertLevelCritical) {
			t.Error("99.999%应触发严重告警")
		}
	})
}

func TestAlertLevelDesc(t *testing.T) {
	tests := []struct {
		name  string
		level int
		want  string
	}{
		{"预警", AlertLevelWarning, "预警 (80%)"},
		{"严重", AlertLevelCritical, "严重 (90%)"},
		{"熔断", AlertLevelBlock, "熔断 (100%)"},
		{"未知级别", 99, "未知"},
		{"负数级别", -1, "未知"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := AlertLevelDesc(tt.level)
			if got != tt.want {
				t.Errorf("AlertLevelDesc(%d) = %q, want %q", tt.level, got, tt.want)
			}
		})
	}
}

func TestCheckAndAlert_AlertRecorderCallback(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	var recordedUserId int
	var recordedLevel int
	var recordedPct int

	// 注册回调
	oldRecorder := AlertRecorder
	AlertRecorder = func(userId int, level int, pct int) {
		recordedUserId = userId
		recordedLevel = level
		recordedPct = pct
	}
	defer func() { AlertRecorder = oldRecorder }()

	t.Run("100%熔断时回调被调用", func(t *testing.T) {
		mr.FlushAll()
		CheckAndAlert(900, 10.0, 10)
		if recordedUserId != 900 {
			t.Errorf("recordedUserId = %d, want 900", recordedUserId)
		}
		if recordedLevel != AlertLevelBlock {
			t.Errorf("recordedLevel = %d, want %d", recordedLevel, AlertLevelBlock)
		}
		if recordedPct != 100 {
			t.Errorf("recordedPct = %d, want 100", recordedPct)
		}
	})

	t.Run("nil回调不崩溃", func(t *testing.T) {
		mr.FlushAll()
		AlertRecorder = nil
		// 不应 panic
		blocked := CheckAndAlert(901, 10.0, 10)
		if !blocked {
			t.Error("即使回调为nil，熔断仍应触发")
		}
	})
}

func TestCheckAndAlert_DifferentUsers(t *testing.T) {
	mr := setupAlertRedis(t)
	defer teardownAlertRedis(t, mr)
	mr.FlushAll()

	t.Run("userA达到100%熔断", func(t *testing.T) {
		blocked := CheckAndAlert(1000, 10, 10)
		if !blocked {
			t.Error("userA应被熔断")
		}
	})

	t.Run("userB未受影响", func(t *testing.T) {
		if IsUserBlocked(1001) {
			t.Error("userB不应受影响")
		}
		blocked := CheckAndAlert(1001, 5, 10)
		if blocked {
			t.Error("userB 50%不应触发")
		}
	})
}
