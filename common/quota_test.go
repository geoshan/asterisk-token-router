package common

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
)

// setupRedis 初始化 miniredis 用于测试
func setupRedis(t *testing.T) *miniredis.Miniredis {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("miniredis 启动失败: %v", err)
	}
	RDB = redis.NewClient(&redis.Options{Addr: mr.Addr()})
	RedisEnabled = true
	return mr
}

// teardownRedis 清理测试环境
func teardownRedis(t *testing.T, mr *miniredis.Miniredis) {
	t.Helper()
	// 不清空 RDB/RedisEnabled，让后续 test 函数能 setup 覆盖
	mr.Close()
}

func TestIncrUserQuota(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)

	t.Run("首次增加用量", func(t *testing.T) {
		// 清理之前可能的数据
		mr.FlushAll()
		got, err := IncrUserQuota(1, 0.5)
		if err != nil {
			t.Fatalf("IncrUserQuota() error = %v", err)
		}
		if got != 0.5 {
			t.Errorf("IncrUserQuota() = %v, want 0.5", got)
		}
	})

	t.Run("累加用量", func(t *testing.T) {
		got, err := IncrUserQuota(1, 0.3)
		if err != nil {
			t.Fatalf("IncrUserQuota() error = %v", err)
		}
		if got != 0.8 {
			t.Errorf("IncrUserQuota() = %v, want 0.8", got)
		}
	})

	t.Run("获取当前用量", func(t *testing.T) {
		got, err := GetUserQuota(1)
		if err != nil {
			t.Fatalf("GetUserQuota() error = %v", err)
		}
		if got != 0.8 {
			t.Errorf("GetUserQuota() = %v, want 0.8", got)
		}
	})
}

func TestIncrUserQuota_MultiUserIsolation(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	// User 1: 增加 0.8
	IncrUserQuota(1, 0.8)
	// User 2: 增加 1.2
	IncrUserQuota(2, 1.2)

	t.Run("user1配额独立", func(t *testing.T) {
		got, _ := GetUserQuota(1)
		if got != 0.8 {
			t.Errorf("GetUserQuota(1) = %v, want 0.8", got)
		}
	})

	t.Run("user2配额独立", func(t *testing.T) {
		got, _ := GetUserQuota(2)
		if got != 1.2 {
			t.Errorf("GetUserQuota(2) = %v, want 1.2", got)
		}
	})
}

func TestGetUserQuota_NotExists(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	t.Run("不存在的用户返回0", func(t *testing.T) {
		got, err := GetUserQuota(999)
		if err != nil {
			t.Fatalf("GetUserQuota() error = %v", err)
		}
		if got != 0 {
			t.Errorf("GetUserQuota() = %v, want 0", got)
		}
	})
}

func TestIncrUserQuota_LargeCost(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	t.Run("大额费用", func(t *testing.T) {
		got, err := IncrUserQuota(100, 9999.99)
		if err != nil {
			t.Fatalf("IncrUserQuota() error = %v", err)
		}
		if got != 9999.99 {
			t.Errorf("IncrUserQuota() = %v, want 9999.99", got)
		}
	})
}

func TestIncrUserQuota_FloatPrecision(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	t.Run("浮点精度累加", func(t *testing.T) {
		IncrUserQuota(200, 0.33333)
		IncrUserQuota(200, 0.33333)
		got, _ := IncrUserQuota(200, 0.33334)
		// 0.33333 + 0.33333 + 0.33334 ≈ 1.0
		if got < 0.999 || got > 1.001 {
			t.Errorf("IncrUserQuota() = %v, want ~1.0", got)
		}
	})
}

func TestBlockUser_UnblockUser(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	userId := 10

	t.Run("初始未熔断", func(t *testing.T) {
		if IsUserBlocked(userId) {
			t.Error("新用户不应被熔断")
		}
	})

	t.Run("熔断用户", func(t *testing.T) {
		err := BlockUser(userId)
		if err != nil {
			t.Fatalf("BlockUser() error = %v", err)
		}
		if !IsUserBlocked(userId) {
			t.Error("熔断后 IsUserBlocked 应返回 true")
		}
	})

	t.Run("解除熔断", func(t *testing.T) {
		err := UnblockUser(userId)
		if err != nil {
			t.Fatalf("UnblockUser() error = %v", err)
		}
		if IsUserBlocked(userId) {
			t.Error("解除熔断后 IsUserBlocked 应返回 false")
		}
	})
}

func TestBlockUser_MultiUserIndependence(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	BlockUser(1)

	t.Run("user1被熔断", func(t *testing.T) {
		if !IsUserBlocked(1) {
			t.Error("user1 应被熔断")
		}
	})

	t.Run("user2不受影响", func(t *testing.T) {
		if IsUserBlocked(2) {
			t.Error("user2 不应受影响")
		}
	})
}

func TestIsAlertSent_MarkAlertSent(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	userId := 42

	t.Run("初始未发送", func(t *testing.T) {
		if IsAlertSent(userId, 1) {
			t.Error("初始状态不应已发送告警")
		}
	})

	t.Run("标记告警已发送", func(t *testing.T) {
		err := MarkAlertSent(userId, 1)
		if err != nil {
			t.Fatalf("MarkAlertSent() error = %v", err)
		}
		if !IsAlertSent(userId, 1) {
			t.Error("标记后 IsAlertSent 应返回 true")
		}
	})

	t.Run("不同级别独立", func(t *testing.T) {
		if IsAlertSent(userId, 2) {
			t.Error("未标记的级别不应返回 true")
		}
	})
}

func TestResetQuota(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	userId := 999
	IncrUserQuota(userId, 5.5)

	t.Run("重置前用量", func(t *testing.T) {
		got, _ := GetUserQuota(userId)
		if got != 5.5 {
			t.Errorf("GetUserQuota() = %v, want 5.5", got)
		}
	})

	t.Run("重置用量", func(t *testing.T) {
		err := ResetQuota(userId)
		if err != nil {
			t.Fatalf("ResetQuota() error = %v", err)
		}
		got, _ := GetUserQuota(userId)
		if got != 0 {
			t.Errorf("重置后 GetUserQuota() = %v, want 0", got)
		}
	})
}

func TestCurrentMonthKey(t *testing.T) {
	key := CurrentMonthKey()
	if key == "" {
		t.Error("CurrentMonthKey() 不应返回空字符串")
	}
	// 格式应为 YYYY-MM
	if len(key) != 7 {
		t.Errorf("CurrentMonthKey() = %q, 长度应为7 (YYYY-MM格式)", key)
	}
}

// TestQuota_RedisDisabled 测试 Redis 禁用时的行为
func TestQuota_RedisDisabled(t *testing.T) {
	RedisEnabled = false
	defer func() { RedisEnabled = true }()

	t.Run("Redis禁用时IncrUserQuota返回0", func(t *testing.T) {
		got, err := IncrUserQuota(1, 10.0)
		if err != nil {
			t.Errorf("Redis禁用时不应返回错误: %v", err)
		}
		if got != 0 {
			t.Errorf("Redis禁用时 IncrUserQuota() = %v, want 0", got)
		}
	})

	t.Run("Redis禁用时GetUserQuota返回0", func(t *testing.T) {
		got, err := GetUserQuota(1)
		if err != nil {
			t.Errorf("Redis禁用时不应返回错误: %v", err)
		}
		if got != 0 {
			t.Errorf("Redis禁用时 GetUserQuota() = %v, want 0", got)
		}
	})

	t.Run("Redis禁用时IsUserBlocked返回false", func(t *testing.T) {
		if IsUserBlocked(1) {
			t.Error("Redis禁用时 IsUserBlocked 应返回 false")
		}
	})

	t.Run("Redis禁用时BlockUser返回nil", func(t *testing.T) {
		if err := BlockUser(1); err != nil {
			t.Errorf("Redis禁用时 BlockUser 不应返回错误: %v", err)
		}
	})

	t.Run("Redis禁用时UnblockUser返回nil", func(t *testing.T) {
		if err := UnblockUser(1); err != nil {
			t.Errorf("Redis禁用时 UnblockUser 不应返回错误: %v", err)
		}
	})
}

// TestIncrUserQuota_Concurrent 并发写入测试
func TestIncrUserQuota_Concurrent(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	n := 10
	done := make(chan bool, n)

	for i := 0; i < n; i++ {
		go func() {
			IncrUserQuota(500, 0.1)
			done <- true
		}()
	}

	for i := 0; i < n; i++ {
		<-done
	}

	got, _ := GetUserQuota(500)
	expected := float64(n) * 0.1 // 1.0
	if got != expected {
		t.Errorf("并发写入后 GetUserQuota() = %v, want %v", got, expected)
	}
}

// 确保 Redis key 在跨月时区分
func TestQuota_MonthKeyPrefix(t *testing.T) {
	mr := setupRedis(t)
	defer teardownRedis(t, mr)
	mr.FlushAll()

	monthKey := CurrentMonthKey()
	ctx := context.Background()

	// 手动设置一个 key
	key := "asterisk:user:777:quota:" + monthKey
	RDB.Set(ctx, key, 3.14, 0)

	got, err := GetUserQuota(777)
	if err != nil {
		t.Fatalf("GetUserQuota() error = %v", err)
	}
	if got != 3.14 {
		t.Errorf("GetUserQuota() = %v, want 3.14", got)
	}
}
