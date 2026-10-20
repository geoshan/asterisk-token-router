package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/model"
)

// GetUsageSummary returns an aggregated token-usage report grouped by
// user × date × model_name over a time range. Admin-only.
//
// Query params:
//
//	user_id     int    (default 0 = all users; admin can set a specific id)
//	start       int64  unix seconds (default: 7 days ago)
//	end         int64  unix seconds (default: now)
//	model_name  string (default "" = all models)
//
// Response shape:
//
//	{ success: true,
//	  data: [...],
//	  summary: { total_requests, total_prompt, total_completion, total_tokens } }
func GetUsageSummary(c *gin.Context) {
	// Permission check — only admin (role >= 10) may view usage summaries.
	// AdminAuth() middleware already enforces this on the route, so the
	// explicit check here is a defensive backstop (see SKILL pitfall 12b:
	// ctxkey.Role may not always be populated). We keep it belt-and-braces.
	if c.GetInt(ctxkey.Role) < 10 {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "无权限：仅管理员可查看用量摘要",
		})
		return
	}

	userId, _ := strconv.Atoi(c.Query("user_id"))
	if userId < 0 {
		userId = 0
	}

	now := time.Now().Unix()
	end, _ := strconv.ParseInt(c.Query("end"), 10, 64)
	if end <= 0 {
		end = now
	}
	start, _ := strconv.ParseInt(c.Query("start"), 10, 64)
	if start <= 0 {
		// default: 7 days back, in seconds
		start = now - 7*24*3600
	}
	if start > end {
		start, end = end, start
	}

	modelName := c.Query("model_name")

	results, err := model.GetUsageSummary(userId, start, end, modelName)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Build the totals summary across all returned rows.
	summary := gin.H{
		"total_requests":   0,
		"total_prompt":     0,
		"total_completion": 0,
		"total_tokens":     0,
		"total_quota_cost": 0,
	}
	for _, r := range results {
		summary["total_requests"] = summary["total_requests"].(int) + r.RequestCount
		summary["total_prompt"] = summary["total_prompt"].(int) + r.PromptTokens
		summary["total_completion"] = summary["total_completion"].(int) + r.CompletionTokens
		summary["total_tokens"] = summary["total_tokens"].(int) + r.TotalTokens
		summary["total_quota_cost"] = summary["total_quota_cost"].(int) + r.QuotaCost
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    results,
		"summary": summary,
	})
}
