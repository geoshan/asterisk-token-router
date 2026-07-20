package model

import (
	"fmt"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
)

// Alert 告警记录
type Alert struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId       int    `json:"user_id" gorm:"index"`
	Level        int    `json:"level"`         // 1=80% 2=90% 3=100%
	ThresholdPct int    `json:"threshold_pct"` // 触发时百分比
	NotifiedTo   string `json:"notified_to"`   // 通知对象
	Handled      bool   `json:"handled" gorm:"default:false"`
	CreatedAt    int64  `json:"created_at" gorm:"bigint"`
	HandledAt    int64  `json:"handled_at" gorm:"bigint;default:0"`
}

func (a *Alert) TableName() string {
	return "alerts"
}

func (a *Alert) Insert() error {
	return DB.Create(a).Error
}

func (a *Alert) Update() error {
	return DB.Model(a).Updates(a).Error
}

// GetAlertsByUser 查询用户的告警记录
func GetAlertsByUser(userId int, startIdx int, num int) ([]*Alert, int64, error) {
	var alerts []*Alert
	var total int64
	err := DB.Model(&Alert{}).Where("user_id = ?", userId).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = DB.Where("user_id = ?", userId).Order("id desc").Offset(startIdx).Limit(num).Find(&alerts).Error
	return alerts, total, err
}

// GetAllAlerts 查询所有告警记录（管理后台用）
func GetAllAlerts(startIdx int, num int, level int, handled *bool) ([]*Alert, int64, error) {
	var alerts []*Alert
	var total int64
	tx := DB.Model(&Alert{})
	if level > 0 {
		tx = tx.Where("level = ?", level)
	}
	if handled != nil {
		tx = tx.Where("handled = ?", *handled)
	}
	err := tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Offset(startIdx).Limit(num).Find(&alerts).Error
	return alerts, total, err
}

// HandleAlert 标记告警为已处理
func HandleAlert(id int) error {
	return DB.Model(&Alert{}).Where("id = ?", id).Updates(map[string]interface{}{
		"handled":    true,
		"handled_at": helper.GetTimestamp(),
	}).Error
}

// InitAlertRecorder 注册告警记录回调
func InitAlertRecorder() {
	common.AlertRecorder = func(userId int, level int, pct int) {
		alert := &Alert{
			UserId:       userId,
			Level:        level,
			ThresholdPct: pct,
			CreatedAt:    helper.GetTimestamp(),
		}
		if err := alert.Insert(); err != nil {
			logger.SysError(fmt.Sprintf("failed to save alert: %v", err))
		}
	}
}
