<!-- 创建活动卡片 -->
<template>
  <el-row>
    <el-col :span="24">
      <el-card shadow="hover" class="el-card--newact" @click="$emit('add')">
        <div class="card-add--newact">+</div>
        <h4>搭建活动</h4>
        <div class="step-disc">
          <span>新建活动</span>
          <span>→</span>
          <span>填写活动信息</span>
          <span>→</span>
          <span class="step-disc__highlight">配置前端样式</span>
          <span>→</span>
          <span>活动预览预发布</span>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'act-create-card',
});
</script>

<style lang="scss" scoped>
.el-card--newact {
  min-height: 319px;
  cursor: pointer;
  position: relative;
  text-align: center;

  .card-add--newact {
    width: 100%;
    line-height: 1;
    text-align: center;
    font-size: 100px;
  }

  h4 {
    font-size: 20px;
    line-height: 32px;
    height: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .step-disc {
    margin-top: 40px;
    font-size: 16px;
    .step-disc__highlight {
      color: rgb(221, 75, 57);
    }
  }
}
</style>
