import { useContext, useEffect, useState } from 'react';

import type TMagicApp from '@tmagic/core';
import { type MComponent, type StyleSchema, toLine } from '@tmagic/core';

import AppContent from '../AppContent';

export interface StatusData {
  style?: StyleSchema;
  className?: string;
  [key: string]: any;
}

export const useComponentStatus = (props: { config: Omit<MComponent, 'id'> }) => {
  const app: TMagicApp | undefined = useContext(AppContent);

  const [status, setStatus] = useState('default');
  const [style, setStyle] = useState({});
  const [className, setClassName] = useState('');
  const styleStatusMap = new Map<string, StyleSchema>();
  const classStatusMap = new Map<string, string>();
  const statusMap = new Map<string, Omit<StatusData, 'style' | 'className'>>();

  const registerStatus = (type: string, { style, className, ...data }: StatusData) => {
    if (style) {
      styleStatusMap.set(type, style);
    }

    if (className) {
      classStatusMap.set(type, className);
    }

    statusMap.set(type, data);
  };

  useEffect(() => {
    registerStatus('default', {
      style: props.config.style,
      className: props.config.className,
    });

    return () => {
      styleStatusMap.clear();
      classStatusMap.clear();
      statusMap.clear();
    };
  });

  useEffect(() => {
    const type = status || 'default';
    const defaultStyle = styleStatusMap.get('default') || {};
    const statusStyle = styleStatusMap.get(type);

    let style = app?.transformStyle(defaultStyle) || {};

    if (type !== 'default' && statusStyle) {
      style = Object.keys(statusStyle).reduce((obj, key) => {
        const value = statusStyle[key];
        if (value === null || typeof value === 'undefined' || isNaN(value) || value === '') {
          return {
            ...obj,
            [key]: statusStyle[key],
          };
        }
        return { ...obj };
      }, style);
    }

    if (props.config.displayHidden) {
      style.display = 'none';
    }

    if (typeof props.config.condResult !== 'undefined' && props.config.displayRenderModel === 'mount') {
      if (props.config.condResult === false) {
        style.display = 'none';
      }
    }

    setStyle(style);

    const className = classStatusMap.get(type) ?? '';

    const list = [];

    if (props.config.type) {
      list.push(`magic-ui-${toLine(props.config.type)}`);
    }

    if (props.config.layout) {
      list.push(`magic-layout-${props.config.layout}`);
    }

    if (className) {
      list.push(className);
    }

    setClassName(list.join(' '));
  }, [status, props.config]);

  return {
    status,
    style,
    className,

    setStatus,
    registerStatus,
  };
};
