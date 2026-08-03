/**
 * @tarojs/components Mock
 */
import React from 'react'

const createComponent = (tag: string) => {
  return React.forwardRef((props: any, ref: any) => {
    const { children, ...rest } = props
    return React.createElement(tag, { ...rest, ref }, children)
  })
}

export const View = createComponent('view')
export const Text = createComponent('text')
export const Button = createComponent('button')
export const Input = createComponent('input')
export const Image = createComponent('image')
export const ScrollView = createComponent('scroll-view')
export const Picker = createComponent('picker')
export const Swiper = createComponent('swiper')
export const SwiperItem = createComponent('swiper-item')
export const Icon = createComponent('icon')
export const Progress = createComponent('progress')
export const RichText = createComponent('rich-text')
