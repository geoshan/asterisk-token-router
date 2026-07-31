package model

import "time"

const (
	QuotaRequestPending  = 0
	QuotaRequestApproved = 1
	QuotaRequestRejected = 2
)

type QuotaRequest struct {
	Id        int    `json:"id"`
	TokenId   int    `json:"token_id" gorm:"index"`
	UserId    int    `json:"user_id" gorm:"index"`
	Amount    int64  `json:"amount"`
	ReqType   string `json:"req_type" gorm:"type:varchar(16);default:'total'"` // monthly or total
	Reason    string `json:"reason" gorm:"type:text"`
	Status    int    `json:"status" gorm:"default:0"`
	CreatedAt int64  `json:"created_at" gorm:"bigint;autoCreateTime"`
}

func CreateQuotaRequest(req *QuotaRequest) error {
	return DB.Create(req).Error
}

func GetPendingQuotaRequests() ([]*QuotaRequest, error) {
	var reqs []*QuotaRequest
	err := DB.Where("status = ?", QuotaRequestPending).Order("id desc").Find(&reqs).Error
	return reqs, err
}

func ApproveQuotaRequest(id int) error {
	var req QuotaRequest
	if err := DB.First(&req, id).Error; err != nil {
		return err
	}
	req.Status = QuotaRequestApproved

	// Update token quota
	var token Token
	if err := DB.First(&token, req.TokenId).Error; err != nil {
		return err
	}
	if req.ReqType == "monthly" {
		token.RemainQuota += req.Amount
	} else {
		token.RemainQuota += req.Amount
	}
	if err := DB.Model(&token).Select("remain_quota").Updates(&token).Error; err != nil {
		return err
	}

	return DB.Save(&req).Error
}

func RejectQuotaRequest(id int) error {
	return DB.Model(&QuotaRequest{}).Where("id = ?", id).Update("status", QuotaRequestRejected).Error
}

func init() {
	time.Sleep(0) // force import
}
