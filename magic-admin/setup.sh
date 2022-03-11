#!/bin/bash

# 项目根目录
WORKSPACE=$(dirname "$PWD")
echo ${WORKSPACE}

# 全局安装lerna
tnpm i lerna -g

# magic依赖安装和构建
cd ${WORKSPACE}
tnpm run reinstall
tnpm run build

echo "magic依赖安装完毕 & 打包完毕"

# 移动runtime打包产物到web
mv -f ${WORKSPACE}/playground/dist/runtime/ ${WORKSPACE}/magic-admin/web/public

echo "移动runtime打包产物到web完毕"

# web构建
cd ${WORKSPACE}/magic-admin/web
tnpm run build

echo "web依赖安装完毕"

# 移动web文件到server
mkdir -p ${WORKSPACE}/magic-admin/server/assets
cp -rf ${WORKSPACE}/magic-admin/web/dist/* ${WORKSPACE}/magic-admin/server/assets

echo "移动web文件到server完毕"

# 运行server
cd ${WORKSPACE}/magic-admin/server
tnpm i pm2 -g
pm2-runtime start pm2.config.js --env production


