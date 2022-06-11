-- 活动基础信息表
CREATE TABLE `magic_act_info` (
  `act_id` int(20) NOT NULL AUTO_INCREMENT COMMENT '活动id',
  `act_crypto_id` varchar(128) NOT NULL COMMENT '活动加密ID',
  `act_name` varchar(128) NOT NULL COMMENT '活动名称',
  `act_begin_time` varchar(128) NOT NULL COMMENT '活动开始时间',
  `act_end_time` varchar(128) NOT NULL COMMENT '活动结束时间',
  `act_modify_time` varchar(128) DEFAULT NULL COMMENT '活动修改时间',
  `act_create_time` varchar(128) NOT NULL COMMENT '活动创建时间',
  `operator` varchar(512) DEFAULT NULL COMMENT '负责人',
  `locker` varchar(128) DEFAULT NULL COMMENT '当前正在编辑的人',
  `lock_time` datetime DEFAULT NULL COMMENT '锁定时间',
  `act_status` int(11) DEFAULT NULL COMMENT '活动状态：0-修改中，1-部分已发布，2-已发布',
  `abtest_raw` mediumtext COMMENT 'serialize后的abtest',
  PRIMARY KEY (`act_id`),
  KEY `act_name` (`act_name`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COMMENT = '魔方开源-活动信息表';

-- 页面配置表
CREATE TABLE `magic_ui_config` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT COMMENT '页面id',
  `act_id` int(8) NOT NULL COMMENT '活动id',
  `c_dist_code` mediumblob COMMENT 'babel编译后的config',
  `c_src_code` mediumblob COMMENT 'config 源码',
  `c_c_time` varchar(128) DEFAULT NULL COMMENT 'config创建时间',
  `c_m_time` varchar(128) DEFAULT NULL COMMENT 'config修改时间',
  `c_ui_version` varchar(64) DEFAULT NULL COMMENT 'magic-ui 版本',
  `page_title` varchar(128) NOT NULL COMMENT '活动页面标题（H5顶部展示）',
  `page_publish_time` varchar(128) DEFAULT NULL COMMENT '页面发布时间',
  `page_publish_status` int(11) NOT NULL DEFAULT '0' COMMENT '页面发布状态：修改中0，已发布1',
  `publish_operator` varchar(128) DEFAULT NULL COMMENT '发布人',
  `web_plugin` varchar(255) DEFAULT NULL COMMENT 'web插件',
  `page_name` varchar(128) DEFAULT NULL COMMENT '页面名称（编辑器页面唯一标识）',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COMMENT = '魔方开源-uiconfig表';
