package common

import (
	"context"
	"fmt"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
)

const (
	QuotaKeyPrefix     = "asterisk:user:%d:quota"
	BlockedKeyPrefix   = "asterisk:user:%d:blocked"
	AlertSentKeyPrefix = "asterisk:user:%d:alert:%d" // user_id, level
)

// CurrentMonthKey 返回当前月份的 Redis key 后缀，格式 YYYY-MM
func CurrentMonthKey() string {
	return time.Now().Format("2006-01")
}

// IncrUserQuota 增加用户的周期用量
// 返回当前累计用量
func IncrUserQuota(userId int, cost float64) (float64, error) {
	if !RedisEnabled {
		return 0, nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(QuotaKeyPrefix+":%s", userId, CurrentMonthKey())
	result, err := RDB.IncrByFloat(ctx, key, cost).Result()
	if err != nil {
		logger.SysError(fmt.Sprintf("IncrUserQuota failed for user %d: %v", userId, err))
		return 0, err
	}
	// Set expiry to 45 days (covers a full month + buffer)
	RDB.Expire(ctx, key, 45*24*time.Hour)
	return result, nil
}

// GetUserQuota 获取用户当前周期用量
func GetUserQuota(userId int) (float64, error) {
	if !RedisEnabled {
		return 0, nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(QuotaKeyPrefix+":%s", userId, CurrentMonthKey())
	result, err := RDB.Get(ctx, key).Float64()
	if err != nil {
		return 0, nil // key not found = 0
	}
	return result, nil
}

// IsUserBlocked 检查用户是否被熔断
func IsUserBlocked(userId int) bool {
	if !RedisEnabled {
		return false
	}
	ctx := context.Background()
	key := fmt.Sprintf(BlockedKeyPrefix, userId)
	exists, _ := RDB.Exists(ctx, key).Result()
	return exists > 0
}

// BlockUser 熔断用户
func BlockUser(userId int) error {
	if !RedisEnabled {
		return nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(BlockedKeyPrefix, userId)
	err := RDB.Set(ctx, key, "1", 45*24*time.Hour).Err()
	if err != nil {
		logger.SysError(fmt.Sprintf("BlockUser failed for user %d: %v", userId, err))
	}
	return err
}

// UnblockUser 解除用户熔断
func UnblockUser(userId int) error {
	if !RedisEnabled {
		return nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(BlockedKeyPrefix, userId)
	err := RDB.Del(ctx, key).Err()
	if err != nil {
		logger.SysError(fmt.Sprintf("UnblockUser failed for user %d: %v", userId, err))
	}
	return err
}

// IsAlertSent 检查本月是否已发送指定级别的告警
func IsAlertSent(userId int, level int) bool {
	if !RedisEnabled {
		return false
	}
	ctx := context.Background()
	key := fmt.Sprintf(AlertSentKeyPrefix+":%s", userId, level, CurrentMonthKey())
	exists, _ := RDB.Exists(ctx, key).Result()
	return exists > 0
}

// MarkAlertSent 标记告警已发送
func MarkAlertSent(userId int, level int) error {
	if !RedisEnabled {
		return nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(AlertSentKeyPrefix+":%s", userId, level, CurrentMonthKey())
	err := RDB.Set(ctx, key, "1", 45*24*time.Hour).Err()
	if err != nil {
		logger.SysError(fmt.Sprintf("MarkAlertSent failed for user %d level %d: %v", userId, level, err))
	}
	return err
}

// ResetQuota 重置用户用量（管理员操作或月初自动）
func ResetQuota(userId int) error {
	if !RedisEnabled {
		return nil
	}
	ctx := context.Background()
	key := fmt.Sprintf(QuotaKeyPrefix+":%s", userId, CurrentMonthKey())
	return RDB.Del(ctx, key).Err()
}
