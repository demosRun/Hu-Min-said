"use strict";

/**
 * elastiStack.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;

(function (window) {
  'use strict';

  function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }

    return a;
  } // 判断是否支持3D

  var transEndEventName = 'transitionend'
  var isInit = false;
  function ElastiStack(el, options) {
    this.container = el;
    this.options = extend({}, this.options); // 初始化变量

    isInit = false;
    extend(this.options, options);

    this._init();
  } //根据不同浏览器设置不同样式


  function setTransformStyle(el, tval) {
    el.style.WebkitTransform = tval;
    el.style.msTransform = tval;
    el.style.transform = tval;
  } // 默认配置


  ElastiStack.prototype.options = {
    // 是否启用卡片拖拽
    enable: true,
    // 弹回距离
    distDragBack: 200,
    // 被移出距离
    distDragMax: 450,
    // 是否循环切换
    loop: false,
    ratioX: 5,
    ratioZ: -10,
    // 拖动轴
    axis: 'x',
    // 拖动句柄
    handle: undefined,
    // 切换卡片事件
    onUpdateStack: function onUpdateStack(current) {
      return false;
    },
    atStart: function atStart() {
      return false;
    },
    atEnd: function atEnd() {
      return false;
    }
  }; // 初始化设置

  ElastiStack.prototype.initSetting = function () {
    this.itemsCount = this.items.length;

    this._setStackStyle();

    if (!isInit) {
      this._initDragg();
      this._initEvents();
    }

    isInit = true;
  }; // 初始化


  ElastiStack.prototype._init = function () {
    var _this = this
    // items
    this.items = this.container.children

    this.current = 0; // set initial styles
    setTimeout(function() {
      // 给每一个卡片加上样式
      for (var index = 0; index < _this.container.children.length; index++) {
        var element = _this.container.children[index];
        element.style.transition = 'all 0.3s ease-out'
      }
    }, 100)
    this.initSetting();
  }; // 注册事件


  ElastiStack.prototype._initEvents = function () {
    var _this = this;

    if (!this.options.enable) return;
    this.draggie.on('dragStart', function (event) {
      _this._onDragStart(event.element);
    });
    this.draggie.on('dragEnd', function (event) {
      _this._onDragEnd(event);
    });
  };

  ElastiStack.prototype._setStackStyle = function () {
    for (var ind = 0; ind < this.items.length; ind++) {
      var nowIndex = this.current + ind;
      var item = this.items[nowIndex >= this.items.length ? nowIndex % this.items.length : nowIndex];

      if (ind < 3) {
        item.style.opacity = 1;
        item.style.zIndex = 4 - ind; // 添加动画标签
        item.style.display = "block"
        setTransformStyle(item, 'translate3d(' + ind * this.options.ratioX + 'px, 0, ' + ind * this.options.ratioZ + 'px)');
      } else {
        item.style.opacity = 0;
        item.style.zIndex = 0;
        setTransformStyle(item, 'translate3d(10px, 0, -20px)');
      }
    }
  };

  ElastiStack.prototype._goNext = function (element) {
    // 判断是否有下一条
    if (!this.options.loop && !this.items[this.current + 1]) {
      this._moveBack(element);
      this.options.atEnd();
      return;
    }


    this._disableDragg(); 
    
    var tVal = {x: 100, y: 0}

    setTransformStyle(element, 'translate3d(' + tVal.x + 'px,' + tVal.y + 'px, 0px)');
    element.style.opacity = 0; 
    // after transition ends..

    var self = this,
        // 动画结束事件
    onEndTransFn = function onEndTransFn() {
      element.removeEventListener(transEndEventName, onEndTransFn); // reset first item

      setTransformStyle(element, 'translate3d(' + self.options.ratioX * 2 + ', 0, ' + self.options.ratioZ * 2 + 'px)');
      element.style.left = element.style.top = '0px';
      element.style.zIndex = -1; // 待测试

      if (!self.options.loop) {
        // console.log('移动结束')
        element.style.display = 'none';
      }
      // 前进


      self.current++; // reorder stack
      // 循环

      if (self.current < 0) self.current = self.itemsCount - 1;
      if (self.current > self.itemsCount - 1) self.current = 0; // 回归

      self._setStackStyle(); // add dragging capability


      self._initDragg(); // init drag events on new current item


      self._initEvents(); // callback


      self.options.onUpdateStack(self.current);
    };

    element.addEventListener(transEndEventName, onEndTransFn);
  };

  ElastiStack.prototype._moveBack = function (element) {
    setTransformStyle(element, 'translate3d(0,0,0)');
    element.style.left = '0px';
    element.style.top = '0px';
  };
  // 卡片开始拖拽事件
	ElastiStack.prototype._onDragStart = function( element) {
		classie.remove( element, 'animate' );
	};

  ElastiStack.prototype._goBack = function () {
    var last = this.items[this.current - 1];
    // 没有上一项的回调
    if (!last) {this.options.atStart();return;}

    last.style.display = 'block';
    // 判断是否允许循环

    if (this.options.loop && !last) last = this.items[this.items.length - 1]; // 禁止拖动

    this._disableDragg();

    last.style.opacity = 0;
    last.style.zIndex = 5;

    var tVal = {x: -100, y: 0}
    setTransformStyle(last, 'translate3d(' + tVal.x + 'px,' + tVal.y + 'px, 0px)')
    // after transition ends..
    // return
    var self = this
    setTimeout(function () {
      last.style.opacity = 1; // 前进

      self.current--; // reorder stack
      // 循环

      if (self.current < 0) self.current = self.itemsCount - 1;
      if (self.current > self.itemsCount - 1) self.current = 0;

      self._setStackStyle(); // add dragging capability


      self._initDragg(); // init drag events on new current item


      self._initEvents(); // callback


      self.options.onUpdateStack(self.current);
    }, 200);
  };

  ElastiStack.prototype._onDragEnd = function (event) {
    var element = event.element
    if (this._outOfSight(event)) {
      // 判断是前进还是后退
      if (event.dragPoint.x < 0) {
        this._moveBack(element); // 判断能否回退
        this._goBack(element);
      } else {
        this._goNext(element);
      }
    } else {
      this._moveBack(element);
    }
  };
  // 注册拖拽
  ElastiStack.prototype._initDragg = function () {
    // console.log(this.items[ this.current ])
    if (this.options.enable) {
      this.draggie = new Draggabilly(this.items[this.current], {
        // 限制在父容器中移动
        // containment: true,
        axis: this.options.axis,
        handle: this.options.handle
      });
    }
  };

  ElastiStack.prototype._disableDragg = function () {
    if (!this.options.enable) return;
    this.draggie.disable();
  }; // returns true if x or y is bigger than distDragBack


  ElastiStack.prototype._outOfSight = function (el) {
    return Math.abs(el.position.x) > this.options.distDragBack || Math.abs(el.position.y) > this.options.distDragBack;
  };

  ElastiStack.prototype.add = function (el) {
    this.container.appendChild(el);
    this.items.push(el);
    this.initSetting();
  }; // 获取卡片总数


  ElastiStack.prototype.getSize = function () {
    return this.itemsCount;
  }; // 获取当前卡片index


  ElastiStack.prototype.getCurrent = function () {
    return this.current;
  }; // 获取当前卡片元素


  ElastiStack.prototype.getCurrentItem = function () {
    return this.items[this.current];
  }; // 添加卡片方法


  ElastiStack.prototype.insert = function (el, index) {
    this.container.insertBefore(el, this.container.childNodes[index]);
    this.items.splice(index, 0, el);
    this.initSetting();
  }; // 移除卡片方法


  ElastiStack.prototype.remove = function (index) {
    if (this.items.length === 0) {
      return;
    }

    if (this.current >= index) {
      this.current--;
    }

    this.container.removeChild(this.container.childNodes[index]);
    this.items.splice(index, 1);

    if (this.current >= this.items.length) {
      this.current = 0;
    }

    this.initSetting();
  }; // 模拟切换下一页


  ElastiStack.prototype.next = function (index) {
    // console.log(this.items)
    if (!_owo.isIE) {
      this._goNext(this.items[this.current]);
    } else {
      if (this.items[this.current + 1]) {
        this.items[this.current + 1].style.zIndex = '5'
        this.items[this.current].style.zIndex = '-1'
        this.current++
      } else {
        this.options.atEnd();
      }
    }
  };

  ElastiStack.prototype.last = function () {
    if (!_owo.isIE) {
      this._goBack(this.items[this.current]);
    } else {
      if (this.items[this.current - 1]) {
        this.items[this.current - 1].style.zIndex = '5'
        this.items[this.current].style.zIndex = '-1'
        this.current--
      } else {
        this.options.atStart();
      }
    }
  };

  ElastiStack.prototype.jump = function (index) {
    this._goNext(this.items[index]);
  }; // add to global namespace


  window.ElastiStack = ElastiStack;
})(window);