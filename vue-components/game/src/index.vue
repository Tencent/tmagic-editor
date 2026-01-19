<template>
  <div class="demo-game">
    <div class="game-box">
      <span
        class="dot"
        :style="{ left: dotPosition.x + 'px', top: dotPosition.y + 'px' }"
        @click="handleDotClick"
      ></span>
      <div class="click-counter">
        点击次数: {{ clickCount }}/{{ maxClicks }}/可获取{{ config.prizeDialog?.prizeName }}
      </div>
    </div>
    <div class="game-prize-dialog" v-show="isShowPrize">
      <div class="dialog-body">
        <div class="game-prize-dialog-content">
          <div class="game-prize-dialog-title">恭喜你获得 {{ config.prizeDialog?.prizeName }}</div>
        </div>
        <div class="game-prize-dialog-footer">
          <button @click="handlePrizeConfirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, type PropType, ref } from 'vue';

import { useApp } from '@tmagic/vue-runtime-help';
// 移除无法解析的类型导入，使用基本类型定义
interface MComponent {
  id?: string;
  [key: string]: any;
}

const COMMON_EVENT_PREFIX = 'tmagic:';

interface GameSchema extends Omit<MComponent, 'id'> {
  id?: string;
  type?: 'game';
  text: string;
  level?: number;
  prizeDialog?: {
    prizeName?: string;
  };
}

export default defineComponent<any, any>({
  name: 'tmagic-game',

  props: {
    config: {
      type: Object as PropType<GameSchema>,
      required: true,
    },
    containerIndex: Number,
    model: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props) {
    const { app, node } = useApp(props);
    // 模拟useApp的返回值
    const gameLevel = props.config?.level || 1;

    // 游戏逻辑
    const isShowPrize = ref(false); // 是否显示奖品弹窗
    const dotPosition = ref({ x: 0, y: 0 }); // 点的位置
    const clickCount = ref(0); // 点击计数
    const maxClicks = 5; // 中奖所需点击次数
    let moveInterval: number | null = null; // 移动计时器ID

    // 根据游戏级别设置移动速度（级别越高，速度越快）
    const getMoveInterval = (level: number) => {
      return Math.max(100, 1000 - (level - 1) * 200); // 1级1秒，每升一级减少200ms，最快0.1秒
    };

    // 随机生成新位置，确保在game-box内
    const getRandomPosition = () => {
      // 获取game-box的尺寸
      const gameBox = document.querySelector('.game-box');
      if (!gameBox) return { x: 0, y: 0 };

      const boxRect = gameBox.getBoundingClientRect();
      const boxWidth = boxRect.width;
      const boxHeight = boxRect.height;

      // dot的尺寸（从CSS中获取）
      const dotSize = 10; // width和height都是10px

      // 计算有效位置范围，确保dot完全在box内部
      const maxX = boxWidth - dotSize;
      const maxY = boxHeight - dotSize;

      // 生成随机位置
      return {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    };

    // 移动点
    const moveDot = () => {
      const newPosition = getRandomPosition();
      dotPosition.value = newPosition;
    };

    // 开始移动
    const startMoving = () => {
      if (moveInterval) {
        clearInterval(moveInterval);
      }

      // 初始化位置
      dotPosition.value = getRandomPosition();

      // 设置移动间隔
      moveInterval = window.setInterval(moveDot, getMoveInterval(gameLevel));
    };

    // 停止移动
    const stopMoving = () => {
      if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
      }
    };

    // 重置游戏
    const resetGame = () => {
      // 重置点击计数
      clickCount.value = 0;

      // 隐藏奖品弹窗
      isShowPrize.value = false;

      // 重新开始移动
      startMoving();
    };

    // 处理奖品弹窗确认
    const handlePrizeConfirm = () => {
      resetGame();
    };
    // 处理点的点击事件
    const handleDotClick = () => {
      // 增加点击计数（避免使用++运算符）
      clickCount.value = clickCount.value + 1;

      // 发送点击事件（保留原有功能）
      if (app && node && typeof app.emit === 'function') {
        app.emit(`${COMMON_EVENT_PREFIX}click`, node);
      }

      // 检查是否达到中奖次数
      if (clickCount.value >= maxClicks) {
        // 显示中奖弹窗
        isShowPrize.value = true;

        // 暂时停止移动，方便用户点击弹窗
        if (moveInterval) {
          clearInterval(moveInterval);
          moveInterval = null;
        }
      }
    };

    // 暂时禁用编辑器特定的代码，以避免类型错误
    if (app && app.platform === 'editor' && app.page) {
      console.log('-- props.config --', props, app, app.page.on);
      // 监听编辑器中的 TreeNode 点击事件
      const onEditorSelectHandler = (info: any, _path: any[]) => {
        if (info.node?.comInnerModule === 'prizeDialog' && info.node?.parentId === props.config?.id) {
          isShowPrize.value = true;
        } else {
          isShowPrize.value = false;
        }
        console.log('-- onEditorSelectHandler --', info, props.config);
      };

      // editor model
      setTimeout(() => {
        app.page.on('editor:select', onEditorSelectHandler);
      }, 1000); // 需要延迟监听，在保存后再刷新的情况下，不延时监听不到
    }

    // 生命周期钩子
    onMounted(() => {
      startMoving();
    });

    onUnmounted(() => {
      stopMoving();
    });

    return {
      handleDotClick,
      handlePrizeConfirm,
      dotPosition,
      isShowPrize,
      clickCount,
      maxClicks,
    };
  },
});
</script>
<style scoped>
.game-box {
  position: relative;
  width: 400px;
  height: 300px;
  border: 2px solid #333;
  overflow: hidden;
  background-color: #f0f0f0;
}
.game-box .dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  background-color: #007bff;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.game-box .dot:hover {
  background-color: #0056b3;
  transform: scale(1.2);
}

.game-box .click-counter {
  position: absolute;
  top: 10px;
  left: 0px;
  right: 0px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
}
.game-prize-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.game-prize-dialog .dialog-body {
  background-color: #fff;
  width: 300px;
  min-height: 200px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
}
.game-prize-dialog-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}
.game-prize-dialog-footer {
  text-align: center;
}
.game-prize-dialog-footer button {
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
}
</style>
