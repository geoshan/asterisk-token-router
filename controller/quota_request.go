package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/model"
)

func CreateQuotaRequest(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req model.QuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	req.UserId = userId
	req.Status = model.QuotaRequestPending
	if err := model.CreateQuotaRequest(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "申请已提交"})
}

func GetQuotaRequests(c *gin.Context) {
	if c.GetInt(ctxkey.Role) < 10 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无权限"})
		return
	}
	reqs, err := model.GetPendingQuotaRequests()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": reqs})
}

func HandleQuotaRequest(c *gin.Context) {
	if c.GetInt(ctxkey.Role) < 10 {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无权限"})
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	action := c.Query("action")
	if action == "approve" {
		if err := model.ApproveQuotaRequest(id); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
			return
		}
	} else {
		if err := model.RejectQuotaRequest(id); err != nil {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "处理完成"})
}
