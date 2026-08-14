package common

import (
	"fmt"
	"github.com/songquanpeng/one-api/common/config"
)

func LogQuota(quota int64) string {
	if config.DisplayInCurrencyEnabled {
		return fmt.Sprintf("¥%.2f", float64(quota)/1000000.0)
	} else {
		return fmt.Sprintf("%d 点额度", quota)
	}
}
