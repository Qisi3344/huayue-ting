# 小狼角色源文件

原创灰白毛、紫瞳的小狼女孩，苔绿斗篷与棕色小挎包。大头、短身、竖耳、脸颊毛簇和宽尾巴组成可爱的轮廓。未引入外部模型或贴图，没有 SVG。

wolf-girl.blend 是可编辑的 Blender 源文件。wolf-girl.glb 是游戏实际加载的三维资产，保留标准 glTF 材质，加载后由 Three.js 转成分段卡通着色；眼睛的紫瞳、瞳孔与高光保持清晰。wolf-girl-preview.png 是 Cycles 中性棚拍预览，并非最终游戏渲染效果。

模型通过独立后台 Blender 进程生成，没有读取、修改或覆盖正在打开的其它场景。修改 tools/build-wolf.py 后，在已安装 Blender 的电脑执行 `blender --background --factory-startup --python tools/build-wolf.py` 即可重新生成。

这份模型仍是可编辑体块稿，部件有清楚名称，头与尾巴有独立的姿态节点及 .blend 内的轻待机关键帧。尚未完成生产级连续拓扑、手绘 UV 贴图、蒙皮骨骼或面部绑定。头尾动作在游戏中由程序驱动。
