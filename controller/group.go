package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/model"
)

// GetGroups 返回可用分组列表（/api/group，前端分组下拉依赖）。
// asterisk-token-router V1.2 阶段2：不再遍历倍率表 GroupRatio（已删除），
// 改为从 abilities 表 DISTINCT group 查询。
func GetGroups(c *gin.Context) {
	groupNames := make([]string, 0)
	groupCol := "`group`"
	if common.UsingPostgreSQL {
		groupCol = `"group"`
	}
	err := model.DB.Raw("SELECT DISTINCT " + groupCol + " FROM abilities").Scan(&groupNames).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
			"data":    groupNames,
		})
		return
	}
	if len(groupNames) == 0 {
		// 兜底：无渠道数据时保留 default 分组，避免前端下拉为空
		groupNames = append(groupNames, "default")
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    groupNames,
	})
}
