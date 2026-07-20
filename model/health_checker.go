package model

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
)

const (
	HealthCheckInterval = 60 * time.Second
	MaxUnhealthyCount   = 3
	HealthCheckTimeout  = 10 * time.Second
)

var healthCheckRunning bool
var healthCheckMu sync.Mutex

// StartHealthChecker 启动定时健康检查
func StartHealthChecker() {
	healthCheckMu.Lock()
	if healthCheckRunning {
		healthCheckMu.Unlock()
		return
	}
	healthCheckRunning = true
	healthCheckMu.Unlock()

	go func() {
		ticker := time.NewTicker(HealthCheckInterval)
		defer ticker.Stop()

		time.Sleep(5 * time.Second)
		runHealthCheck()

		for range ticker.C {
			runHealthCheck()
		}
	}()

	logger.SysLog("Health checker started (interval: 60s)")
}

func runHealthCheck() {
	channels, err := GetAllChannels(0, 0, "all")
	if err != nil {
		logger.SysError(fmt.Sprintf("Health check: failed to get channels: %v", err))
		return
	}

	for _, channel := range channels {
		if channel.Status != ChannelStatusEnabled {
			continue
		}

		healthy := checkChannelHealth(channel)
		now := time.Now().Unix()
		channel.TestTime = now

		if healthy {
			channel.ResponseTime = int(time.Now().UnixMilli() - channel.TestTime*1000)
			if channel.ResponseTime < 0 {
				channel.ResponseTime = 0
			}
			channel.UpdateResponseTime(int64(channel.ResponseTime))
		} else {
			logger.SysError(fmt.Sprintf("Health check failed for channel #%d (%s)", channel.Id, channel.Name))
		}
	}
}

func checkChannelHealth(channel *Channel) bool {
	ctx, cancel := context.WithTimeout(context.Background(), HealthCheckTimeout)
	defer cancel()

	baseURL := channel.GetBaseURL()
	if baseURL == "" {
		return false
	}

	url := baseURL + "/v1/models"
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return false
	}
	req.Header.Set("Authorization", "Bearer "+channel.Key)

	client := &http.Client{Timeout: HealthCheckTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 200 && resp.StatusCode < 300
}
