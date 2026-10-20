package model

import "github.com/songquanpeng/one-api/common"

// UsageSummary aggregates token consumption from the logs table by
// user × date × model_name. It is a query-only struct — no new table
// is created (no AutoMigrate needed).
type UsageSummary struct {
	UserId           int    `json:"user_id" gorm:"column:user_id"`
	Username         string `json:"username" gorm:"column:username"`
	ModelName        string `json:"model_name" gorm:"column:model_name"`
	Date             string `json:"date" gorm:"column:date"`
	RequestCount     int    `json:"request_count" gorm:"column:request_count"`
	PromptTokens     int    `json:"prompt_tokens" gorm:"column:prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens" gorm:"column:completion_tokens"`
	TotalTokens      int    `json:"total_tokens" gorm:"column:total_tokens"`
	QuotaCost        int    `json:"quota_cost" gorm:"column:quota_cost"`
}

// getDateSelectSQL returns the DB-specific SQL expression for truncating
// created_at (a unix timestamp in seconds) to a calendar date.
// Mirrors getDayGroupSelect in model/log.go so we stay consistent with
// the existing dashboard aggregation queries.
func getDateSelectSQL() string {
	if common.UsingPostgreSQL {
		return "TO_CHAR(date_trunc('day', to_timestamp(created_at)), 'YYYY-MM-DD') as date"
	}
	if common.UsingSQLite {
		return "strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as date"
	}
	// MySQL — created_at is stored as unix seconds (helper.GetTimestamp => time.Now().Unix())
	return "DATE_FORMAT(FROM_UNIXTIME(created_at), '%Y-%m-%d') as date"
}

// GetUsageSummary aggregates consume logs (type=2) by user × date × model.
//
// userId == 0 means "all users" (admin view). modelName == "" means all models.
// start/end are unix-second timestamps (matching the Log.CreatedAt column).
// Results are ordered by date desc, then user_id.
func GetUsageSummary(userId int, start, end int64, modelName string) ([]UsageSummary, error) {
	dateSelect := getDateSelectSQL()

	query := `
		SELECT user_id, username, model_name,
		       ` + dateSelect + `,
		       COUNT(*) as request_count,
		       SUM(prompt_tokens) as prompt_tokens,
		       SUM(completion_tokens) as completion_tokens,
		       SUM(prompt_tokens + completion_tokens) as total_tokens,
		       SUM(quota) as quota_cost
		FROM logs
		WHERE type = 2
		  AND (user_id = ? OR 0 = ?)
		  AND created_at >= ? AND created_at <= ?
		  AND (? = '' OR model_name = ?)
		GROUP BY user_id, username, date, model_name
		ORDER BY date DESC, user_id
	`

	var results []UsageSummary
	err := LOG_DB.Raw(query, userId, userId, start, end, modelName, modelName).Scan(&results).Error
	return results, err
}
