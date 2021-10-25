const Button = defineComponent({

    name: 'Button',
  
    props: {},
  
    setup(props) {},
  
    render() {
        // $slots: 类似孩子节点所属的对象
        // mergedClsPrefix: 组件命名空间前缀
        // tag：
      const { $slots, mergedClsPrefix, tag: Component } = this;
  
      const children = flatten(getSlot(this));
  
  
  
      return (
  
        <Component 
  
          ref="selfRef"
  
          // 第二部分
          // 其中 class 则根据传进来的属性来判定属于哪种 type：
          // primary 、info 、warning 、success 、error 
          // 以及当前处于什么状态：disabled 、block 、pressed 、dashed 、color 、ghost ，
          // 根据这些 type 和状态给予合适的类名，从而为组件定义对应类名所属的 CSS 样式
          class={[
  
            `${mergedClsPrefix}-button`,
  
            `${mergedClsPrefix}-button--${this.type}-type`,
  
            {
  
              [`${mergedClsPrefix}-button--disabled`]: this.disabled,
  
              [`${mergedClsPrefix}-button--block`]: this.block,
  
              [`${mergedClsPrefix}-button--pressed`]: this.enterPressed,
  
              [`${mergedClsPrefix}-button--dashed`]: !this.text && this.dashed,
  
              [`${mergedClsPrefix}-button--color`]: this.color,
  
              [`${mergedClsPrefix}-button--ghost`]: this.ghost, // required for button group border collapse
  
            },
  
          ]}
          // 表示在使用 tab 时，此按钮是否被选中
          tabindex={this.mergedFocusable ? 0 : -1}
          
          // type 则表示为 button 、 submit 、reset 等按钮类型
          // 使得按钮可以被整合进 <Form /> 组件来完成更加复杂的操作，如表单提交的触发等；
          type={this.attrType}
          
          // style 则是为此组件传入所需的 CSS Variables，即 CSS变量，
          // 而在 setup 函数时，会通过 useTheme （后续会谈到）钩子去挂载 Button 相关的样式，
          // 这些样式中大量使用 CSS Variables 来自定义组件各种 CSS 属性，以及处理全局的主题切换，如 Dark Mode 等
          style={this.cssVars}
          
          // disabled 则是控制此按钮是否可操作，true 代表被禁用，不可操作，false 代表可操作为默认值
          disabled={this.disabled}
  
          onClick={this.handleClick}
  
          onBlur={this.handleBlur}
  
          onMousedown={this.handleMouseDown}
  
          onKeyup={this.handleKeyUp}
  
          onKeydown={this.handleKeyDown}
  
          >
  
          // 在 iconPlacement 为 left 、right 时，组件孩子节点的展示形式
          // 即图标在左和右时，孩子节点分布以 <span /> 或 <div /> 标签的形式展示
          // 当为 right 时，设置为 <div /> 则是为了更好的处理布局与定位
  
          {$slots.default && this.iconPlacement === "right" ? (
  
            <div class={`${mergedClsPrefix}-button__content`}>{children}</div>
  
          ) : null}
  
          // 为图标相关内容，NFadeInExpandTransition 为控制 Icon 出现和消失的过渡动画，NIconSwitchTransition 则是控制 loading 形式的 Icon 和其他 Icon 的切换过渡动画
  
          <NFadeInExpandTransition width>
  
            {{
  
              default: () =>
  
                $slots.icon || this.loading ? (
  
                  <span
  
                    class={`${mergedClsPrefix}-button__icon`}
  
                    style={{
  
                      margin: !$slots.default ? 0 : "",
  
                    }}
  
                  >
  
                    <NIconSwitchTransition>
  
                      {{
  
                        default: () =>
  
                          this.loading ? (
  
                            <NBaseLoading
  
                              clsPrefix={mergedClsPrefix}
  
                              key="loading"
  
                              class={`${mergedClsPrefix}-icon-slot`}
  
                              strokeWidth={20}
  
                            />
  
                          ) : (
  
                            <div
  
                              key="icon"
  
                              class={`${mergedClsPrefix}-icon-slot`}
  
                              role="none"
  
                            >
  
                              {renderSlot($slots, "icon")}
  
                            </div>
  
                          ),
  
                      }}
  
                    </NIconSwitchTransition>
  
                  </span>
  
                ) : null,
  
            }}
  
          </NFadeInExpandTransition>
  
          // 第三部分
  
          {$slots.default && this.iconPlacement === "left" ? (
  
            <span class={`${mergedClsPrefix}-button__content`}>{children}</span>
  
          ) : null}
  
          // 当按钮不以 text 节点的形式展示时，其上应该有处理反馈的波纹，通过上述视频也可以看到在点按钮时会有对应的波纹效果来给出点击反馈，如下图展示为类文本形式，在点击时就不能出现波纹扩散效果
  
          {!this.text ? (
  
            <NBaseWave ref="waveRef" clsPrefix={mergedClsPrefix} />
  
          ) : null}
  
          // 主要是通过 <div /> 去模拟组件的边框：border 和 state-border ，前者主要静态、默认的处理边框颜色、宽度等，后者则是处理在不同状态下：focus 、hover 、active 、pressed 等下的 border 样式
  
          {this.showBorder ? (
  
            <div
  
              aria-hidden
  
              class={`${mergedClsPrefix}-button__border`}
  
              style={this.customColorCssVars}
  
            />
  
          ) : null}
  
  
          {this.showBorder ? (
  
            <div
  
              aria-hidden
  
              class={`${mergedClsPrefix}-button__state-border`}
  
              style={this.customColorCssVars}
  
            />
  
          ) : null}
  
      </Component>
  
      )
  
    }
});

// 样式的组织艺术

// Native UI 自造了为框架而生，带 SSR 特性的类
// CSS in JS 的方案： css-render
// 目前有两个插件： vue3-ssr,plugin-bem

// css-render 目前的基本使用场景为搭配 plugin-bem
// 插件使用

import CssRender from 'css-render'

import bem from '@css-render/plugin-bem'

const cssr = CssRender();
const plugin = bem({

    blockPrefix: '.ggl-'
  
});
cssr.use(plugin) // 为 cssr 注册 bem 插件

const {cB, cE} = plugin;
const style = cB(
    'container',
    [
        cE(
            'left,right',
            {
                width: '50%'
            }
        ),
        cM(
            'dark',
            [
                cE(
                    'left,right',
                    {
                        backgroundColor: 'black'
                    }
                )
            ]
        )
    ]
)

// result
// .ggl-container .ggl-container__left, 

// .ggl-container .ggl-container__right {

//   width: 50%;

// }



// .ggl-container.ggl-container--dark .ggl-container__left, 

// .ggl-container.ggl-container--dark .ggl-container__right{

//   background-color: black;

// }


// BEM
/* 块 */

// .btn {}



//  /* 依赖块的元素 */ 

// .btn__price {}

// .btn__text {}



//  /* 修改块状态的修饰符 */

// .btn--orange {} 

// .btn--big {}

// CSS RENDER 是如何运作的
// 本质上是一个 css 生成器，提供了 mount 和 unmount api

// Native ui 在样式上主要遵循如下逻辑：
// 挂载 CSS Variables，这里存在默认的变量和用户传进来自定义的变量，将 cssVars 传给标签的 style 字段来挂载
// 挂载 Button 相关基础样式、主题（theme）相关的样式，生成 CSS 类名
// 挂载全局默认样式（这一步在最后，确保全局默认样式不会被覆盖）