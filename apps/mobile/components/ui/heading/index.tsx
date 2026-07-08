import React, { forwardRef, memo } from 'react';
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
import { headingStyle } from './styles';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { cssInterop } from 'nativewind';

type IHeadingBaseProps = VariantProps<typeof headingStyle> &
  React.ComponentPropsWithoutRef<typeof H1>;

type IHeadingProps = IHeadingBaseProps & {
  as?: React.ElementType;
};

cssInterop(H1, { className: 'style' });
cssInterop(H2, { className: 'style' });
cssInterop(H3, { className: 'style' });
cssInterop(H4, { className: 'style' });
cssInterop(H5, { className: 'style' });
cssInterop(H6, { className: 'style' });

function createHeadingStyleProps(
  size: VariantProps<typeof headingStyle>['size'],
  isTruncated: boolean | undefined,
  bold: boolean | undefined,
  underline: boolean | undefined,
  strikeThrough: boolean | undefined,
  sub: boolean | undefined,
  italic: boolean | undefined,
  highlight: boolean | undefined,
  className: string | undefined
) {
  return {
    size,
    isTruncated: isTruncated as boolean,
    bold: bold as boolean,
    underline: underline as boolean,
    strikeThrough: strikeThrough as boolean,
    sub: sub as boolean,
    italic: italic as boolean,
    highlight: highlight as boolean,
    class: className,
  };
}

const MappedHeading = memo(
  forwardRef<React.ComponentRef<typeof H1>, IHeadingBaseProps>(
    function MappedHeading(
      {
        size,
        className,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        ...props
      },
      ref
    ) {
      const styleProps = createHeadingStyleProps(
        size,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        className
      );

      const refProp = ref as React.Ref<any>;
      switch (size) {
        case '5xl':
        case '4xl':
        case '3xl':
          return (
            <H1
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
        case '2xl':
          return (
            <H2
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
        case 'xl':
          return (
            <H3
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
        case 'md':
          return (
            <H5
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
        case 'sm':
        case 'xs':
          return (
            <H6
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
        case 'lg':
        default:
          return (
            <H4
              className={headingStyle(styleProps)}
              {...props}
              ref={refProp}
            />
          );
      }
    }
  )
);

const Heading = memo(
  forwardRef<React.ComponentRef<typeof H1>, IHeadingProps>(
    function Heading(
      {
        className,
        size = 'lg',
        as: AsComp,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        children,
        ...props
      },
      ref
    ) {
      const styleProps = createHeadingStyleProps(
        size,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        className
      );

      if (AsComp) {
        return (
          <AsComp
            className={headingStyle(styleProps)}
            {...props}
          >
            {children}
          </AsComp>
        );
      }

      return (
        <MappedHeading
          className={className}
          size={size}
          isTruncated={isTruncated}
          bold={bold}
          underline={underline}
          strikeThrough={strikeThrough}
          sub={sub}
          italic={italic}
          highlight={highlight}
          ref={ref}
          {...props}
        >
          {children}
        </MappedHeading>
      );
    }
  )
);

Heading.displayName = 'Heading';

export { Heading };
