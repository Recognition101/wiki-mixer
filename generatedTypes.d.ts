/**
 * THIS FILE IS GENERATED. DO NOT EDIT.
 * TO RE-GENERATE: RUN `node ./data/generateTypes.js`
 */

import * as React from 'react';

declare module 'React' {
interface DOMAttributes<T> {
    onRootUpdate?: (ev: { type: 'update', target: HTMLElement })
        => boolean | null | undefined | void;
    onRootResize?: () => boolean | null | undefined | void;
}

interface DOMAttributes<T> {
    onRootCopy?: DOMAttributes<T>['onCopy'];
    onRootCopyCapture?: DOMAttributes<T>['onCopyCapture'];
    onRootCut?: DOMAttributes<T>['onCut'];
    onRootCutCapture?: DOMAttributes<T>['onCutCapture'];
    onRootPaste?: DOMAttributes<T>['onPaste'];
    onRootPasteCapture?: DOMAttributes<T>['onPasteCapture'];
    onRootCompositionEnd?: DOMAttributes<T>['onCompositionEnd'];
    onRootCompositionEndCapture?: DOMAttributes<T>['onCompositionEndCapture'];
    onRootCompositionStart?: DOMAttributes<T>['onCompositionStart'];
    onRootCompositionStartCapture?: DOMAttributes<T>['onCompositionStartCapture'];
    onRootCompositionUpdate?: DOMAttributes<T>['onCompositionUpdate'];
    onRootCompositionUpdateCapture?: DOMAttributes<T>['onCompositionUpdateCapture'];
    onRootFocus?: DOMAttributes<T>['onFocus'];
    onRootFocusCapture?: DOMAttributes<T>['onFocusCapture'];
    onRootBlur?: DOMAttributes<T>['onBlur'];
    onRootBlurCapture?: DOMAttributes<T>['onBlurCapture'];
    onRootChange?: DOMAttributes<T>['onChange'];
    onRootChangeCapture?: DOMAttributes<T>['onChangeCapture'];
    onRootBeforeInput?: DOMAttributes<T>['onBeforeInput'];
    onRootBeforeInputCapture?: DOMAttributes<T>['onBeforeInputCapture'];
    onRootInput?: DOMAttributes<T>['onInput'];
    onRootInputCapture?: DOMAttributes<T>['onInputCapture'];
    onRootReset?: DOMAttributes<T>['onReset'];
    onRootResetCapture?: DOMAttributes<T>['onResetCapture'];
    onRootSubmit?: DOMAttributes<T>['onSubmit'];
    onRootSubmitCapture?: DOMAttributes<T>['onSubmitCapture'];
    onRootInvalid?: DOMAttributes<T>['onInvalid'];
    onRootInvalidCapture?: DOMAttributes<T>['onInvalidCapture'];
    onRootLoad?: DOMAttributes<T>['onLoad'];
    onRootLoadCapture?: DOMAttributes<T>['onLoadCapture'];
    onRootError?: DOMAttributes<T>['onError'];
    onRootErrorCapture?: DOMAttributes<T>['onErrorCapture'];
    onRootKeyDown?: DOMAttributes<T>['onKeyDown'];
    onRootKeyDownCapture?: DOMAttributes<T>['onKeyDownCapture'];
    onRootKeyPress?: DOMAttributes<T>['onKeyPress'];
    onRootKeyPressCapture?: DOMAttributes<T>['onKeyPressCapture'];
    onRootKeyUp?: DOMAttributes<T>['onKeyUp'];
    onRootKeyUpCapture?: DOMAttributes<T>['onKeyUpCapture'];
    onRootAbort?: DOMAttributes<T>['onAbort'];
    onRootAbortCapture?: DOMAttributes<T>['onAbortCapture'];
    onRootCanPlay?: DOMAttributes<T>['onCanPlay'];
    onRootCanPlayCapture?: DOMAttributes<T>['onCanPlayCapture'];
    onRootCanPlayThrough?: DOMAttributes<T>['onCanPlayThrough'];
    onRootCanPlayThroughCapture?: DOMAttributes<T>['onCanPlayThroughCapture'];
    onRootDurationChange?: DOMAttributes<T>['onDurationChange'];
    onRootDurationChangeCapture?: DOMAttributes<T>['onDurationChangeCapture'];
    onRootEmptied?: DOMAttributes<T>['onEmptied'];
    onRootEmptiedCapture?: DOMAttributes<T>['onEmptiedCapture'];
    onRootEncrypted?: DOMAttributes<T>['onEncrypted'];
    onRootEncryptedCapture?: DOMAttributes<T>['onEncryptedCapture'];
    onRootEnded?: DOMAttributes<T>['onEnded'];
    onRootEndedCapture?: DOMAttributes<T>['onEndedCapture'];
    onRootLoadedData?: DOMAttributes<T>['onLoadedData'];
    onRootLoadedDataCapture?: DOMAttributes<T>['onLoadedDataCapture'];
    onRootLoadedMetadata?: DOMAttributes<T>['onLoadedMetadata'];
    onRootLoadedMetadataCapture?: DOMAttributes<T>['onLoadedMetadataCapture'];
    onRootLoadStart?: DOMAttributes<T>['onLoadStart'];
    onRootLoadStartCapture?: DOMAttributes<T>['onLoadStartCapture'];
    onRootPause?: DOMAttributes<T>['onPause'];
    onRootPauseCapture?: DOMAttributes<T>['onPauseCapture'];
    onRootPlay?: DOMAttributes<T>['onPlay'];
    onRootPlayCapture?: DOMAttributes<T>['onPlayCapture'];
    onRootPlaying?: DOMAttributes<T>['onPlaying'];
    onRootPlayingCapture?: DOMAttributes<T>['onPlayingCapture'];
    onRootProgress?: DOMAttributes<T>['onProgress'];
    onRootProgressCapture?: DOMAttributes<T>['onProgressCapture'];
    onRootRateChange?: DOMAttributes<T>['onRateChange'];
    onRootRateChangeCapture?: DOMAttributes<T>['onRateChangeCapture'];
    onRootSeeked?: DOMAttributes<T>['onSeeked'];
    onRootSeekedCapture?: DOMAttributes<T>['onSeekedCapture'];
    onRootSeeking?: DOMAttributes<T>['onSeeking'];
    onRootSeekingCapture?: DOMAttributes<T>['onSeekingCapture'];
    onRootStalled?: DOMAttributes<T>['onStalled'];
    onRootStalledCapture?: DOMAttributes<T>['onStalledCapture'];
    onRootSuspend?: DOMAttributes<T>['onSuspend'];
    onRootSuspendCapture?: DOMAttributes<T>['onSuspendCapture'];
    onRootTimeUpdate?: DOMAttributes<T>['onTimeUpdate'];
    onRootTimeUpdateCapture?: DOMAttributes<T>['onTimeUpdateCapture'];
    onRootVolumeChange?: DOMAttributes<T>['onVolumeChange'];
    onRootVolumeChangeCapture?: DOMAttributes<T>['onVolumeChangeCapture'];
    onRootWaiting?: DOMAttributes<T>['onWaiting'];
    onRootWaitingCapture?: DOMAttributes<T>['onWaitingCapture'];
    onRootAuxClick?: DOMAttributes<T>['onAuxClick'];
    onRootAuxClickCapture?: DOMAttributes<T>['onAuxClickCapture'];
    onRootClick?: DOMAttributes<T>['onClick'];
    onRootClickCapture?: DOMAttributes<T>['onClickCapture'];
    onRootContextMenu?: DOMAttributes<T>['onContextMenu'];
    onRootContextMenuCapture?: DOMAttributes<T>['onContextMenuCapture'];
    onRootDoubleClick?: DOMAttributes<T>['onDoubleClick'];
    onRootDoubleClickCapture?: DOMAttributes<T>['onDoubleClickCapture'];
    onRootDrag?: DOMAttributes<T>['onDrag'];
    onRootDragCapture?: DOMAttributes<T>['onDragCapture'];
    onRootDragEnd?: DOMAttributes<T>['onDragEnd'];
    onRootDragEndCapture?: DOMAttributes<T>['onDragEndCapture'];
    onRootDragEnter?: DOMAttributes<T>['onDragEnter'];
    onRootDragEnterCapture?: DOMAttributes<T>['onDragEnterCapture'];
    onRootDragExit?: DOMAttributes<T>['onDragExit'];
    onRootDragExitCapture?: DOMAttributes<T>['onDragExitCapture'];
    onRootDragLeave?: DOMAttributes<T>['onDragLeave'];
    onRootDragLeaveCapture?: DOMAttributes<T>['onDragLeaveCapture'];
    onRootDragOver?: DOMAttributes<T>['onDragOver'];
    onRootDragOverCapture?: DOMAttributes<T>['onDragOverCapture'];
    onRootDragStart?: DOMAttributes<T>['onDragStart'];
    onRootDragStartCapture?: DOMAttributes<T>['onDragStartCapture'];
    onRootDrop?: DOMAttributes<T>['onDrop'];
    onRootDropCapture?: DOMAttributes<T>['onDropCapture'];
    onRootMouseDown?: DOMAttributes<T>['onMouseDown'];
    onRootMouseDownCapture?: DOMAttributes<T>['onMouseDownCapture'];
    onRootMouseEnter?: DOMAttributes<T>['onMouseEnter'];
    onRootMouseLeave?: DOMAttributes<T>['onMouseLeave'];
    onRootMouseMove?: DOMAttributes<T>['onMouseMove'];
    onRootMouseMoveCapture?: DOMAttributes<T>['onMouseMoveCapture'];
    onRootMouseOut?: DOMAttributes<T>['onMouseOut'];
    onRootMouseOutCapture?: DOMAttributes<T>['onMouseOutCapture'];
    onRootMouseOver?: DOMAttributes<T>['onMouseOver'];
    onRootMouseOverCapture?: DOMAttributes<T>['onMouseOverCapture'];
    onRootMouseUp?: DOMAttributes<T>['onMouseUp'];
    onRootMouseUpCapture?: DOMAttributes<T>['onMouseUpCapture'];
    onRootSelect?: DOMAttributes<T>['onSelect'];
    onRootSelectCapture?: DOMAttributes<T>['onSelectCapture'];
    onRootTouchCancel?: DOMAttributes<T>['onTouchCancel'];
    onRootTouchCancelCapture?: DOMAttributes<T>['onTouchCancelCapture'];
    onRootTouchEnd?: DOMAttributes<T>['onTouchEnd'];
    onRootTouchEndCapture?: DOMAttributes<T>['onTouchEndCapture'];
    onRootTouchMove?: DOMAttributes<T>['onTouchMove'];
    onRootTouchMoveCapture?: DOMAttributes<T>['onTouchMoveCapture'];
    onRootTouchStart?: DOMAttributes<T>['onTouchStart'];
    onRootTouchStartCapture?: DOMAttributes<T>['onTouchStartCapture'];
    onRootPointerDown?: DOMAttributes<T>['onPointerDown'];
    onRootPointerDownCapture?: DOMAttributes<T>['onPointerDownCapture'];
    onRootPointerMove?: DOMAttributes<T>['onPointerMove'];
    onRootPointerMoveCapture?: DOMAttributes<T>['onPointerMoveCapture'];
    onRootPointerUp?: DOMAttributes<T>['onPointerUp'];
    onRootPointerUpCapture?: DOMAttributes<T>['onPointerUpCapture'];
    onRootPointerCancel?: DOMAttributes<T>['onPointerCancel'];
    onRootPointerCancelCapture?: DOMAttributes<T>['onPointerCancelCapture'];
    onRootPointerEnter?: DOMAttributes<T>['onPointerEnter'];
    onRootPointerEnterCapture?: DOMAttributes<T>['onPointerEnterCapture'];
    onRootPointerLeave?: DOMAttributes<T>['onPointerLeave'];
    onRootPointerLeaveCapture?: DOMAttributes<T>['onPointerLeaveCapture'];
    onRootPointerOver?: DOMAttributes<T>['onPointerOver'];
    onRootPointerOverCapture?: DOMAttributes<T>['onPointerOverCapture'];
    onRootPointerOut?: DOMAttributes<T>['onPointerOut'];
    onRootPointerOutCapture?: DOMAttributes<T>['onPointerOutCapture'];
    onRootGotPointerCapture?: DOMAttributes<T>['onGotPointerCapture'];
    onRootGotPointerCaptureCapture?: DOMAttributes<T>['onGotPointerCaptureCapture'];
    onRootLostPointerCapture?: DOMAttributes<T>['onLostPointerCapture'];
    onRootLostPointerCaptureCapture?: DOMAttributes<T>['onLostPointerCaptureCapture'];
    onRootScroll?: DOMAttributes<T>['onScroll'];
    onRootScrollCapture?: DOMAttributes<T>['onScrollCapture'];
    onRootWheel?: DOMAttributes<T>['onWheel'];
    onRootWheelCapture?: DOMAttributes<T>['onWheelCapture'];
    onRootAnimationStart?: DOMAttributes<T>['onAnimationStart'];
    onRootAnimationStartCapture?: DOMAttributes<T>['onAnimationStartCapture'];
    onRootAnimationEnd?: DOMAttributes<T>['onAnimationEnd'];
    onRootAnimationEndCapture?: DOMAttributes<T>['onAnimationEndCapture'];
    onRootAnimationIteration?: DOMAttributes<T>['onAnimationIteration'];
    onRootAnimationIterationCapture?: DOMAttributes<T>['onAnimationIterationCapture'];
    onRootTransitionEnd?: DOMAttributes<T>['onTransitionEnd'];
    onRootTransitionEndCapture?: DOMAttributes<T>['onTransitionEndCapture'];
}
interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    onRootToggle?: DetailsHTMLAttributes<T>['onToggle'];
}
interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    onRootChange?: InputHTMLAttributes<T>['onChange'];
}
interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    onRootChange?: SelectHTMLAttributes<T>['onChange'];
}
interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    onRootChange?: TextareaHTMLAttributes<T>['onChange'];
}
}
