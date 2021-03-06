define(function (require, exports, module) {
  var art = require('utils/artTemplate/index');
  var ui = require('utils/ui/index');
  var BasicView = require('modules/views/abstracts/Basic');
  var tpl = require('templates/publish/publish.tpl');
  var tplContent = require('templates/publish/content.tpl');
  var Navigate = require('utils/Navigate');
  var inCharset = require('utils/inCharset');
  var appCache = require('modules/AppCache').appCache;
  var Notification = require('utils/Notification');
  
  var postUrl = 'http://bbs.ngacn.cc/post.php';
  // var postUrl = '';

  var PublishView = BasicView.extend({
    el: '#publish',
    tpl: art.compile(tpl),
    tplContent: art.compile(tplContent),
    flag: {
      init: true, // 初始化
      // active 主要用于back的操作，避免重复触发后退动作
      active: false,
      // request 用于发送请求，避免重复触发请求动作
      request: false
    },
    cached: {
      tid: 0,
      fid: 0,
      pid: 0,
      action: ''
    },
    events: {
      'singleTap .action-back': function () {
        if (this.flag.active) {
          this.flag.active === false;
          Navigate.back();
        }
      },
      'singleTap .action-ok': function (e) {
        var self = this;
        var $btn = $(e.currentTarget);
        var title = this.$el.find('.param-title').val();
        var content = this.$el.find('.param-content').val();
        if (this.flag.request) {
          return;
        }
        this.flag.request = true;
        $btn.addClass('loading').find('.glyphicon').removeClass('glyphicon-ok').addClass('glyphicon-refresh');
        ui.Loading.open();
        inCharset(content, 'gbk', function (content) {
          inCharset(title, 'gbk', function (title) {
            var data = 'tid=' + self.cached.tid + '&fid=' + self.cached.fid + '&pid=' + self.cached.pid + 
              '&action=' + self.cached.action + '&step=2' + '&lite=xml' +
              '&post_subject=' + title + '&post_content=' + content;
            $.ajax({
              url: postUrl,
              data: data,
              complete: function () {
                self.flag.request = false;
                $btn.removeClass('loading').find('.glyphicon').addClass('glyphicon-ok').removeClass('glyphicon-refresh');
                ui.Loading.close();
              },
              success: function (data) {
                var target;
                console.log(data);
                var jump = $(data).find('__JUMP').text();

                var msg = $(data).find('__MESSAGE > item').eq(1).text();
                if (msg) {
                  Notification.alert(msg);
                }
                if (jump) {
                  // /read.php?tid=6726209&_ff=335&page=e#a 
                  target = jump.match(/tid=(\d+)&_ff=(\d+)/);
                  console.log(target);
                  if (target && target.length === 3) {
                    appCache.get('topicView').fetch({tid: target[1]});
                    Navigate.back();
                  }
                }
              },
              error: function (xml) {
                var msg = xml.response.match(/<__MESSAGE><item>(.*?)<\/item>/);
                if (msg && msg.length === 2) {
                  Notification.alert(msg[1]);
                }
              },
              type: 'post',
              dataType: 'xml'
            });
          });
        });
      },
    },
    open: function (fid, tid) {
      var action;
      this.flag.active = true;
      this.cached.action = tid ? 'reply' : 'new';
      this.cached.tid = tid;
      this.cached.fid = fid;
      this._refresh();
    },
    render: function () {
      this.$el.html(this.tpl());
      this.$content = this.$el.find('.content');
      this._refresh();
      return this;
    },
    _refresh: function () {
      var self = this;
      if (!self.flag.init) {
        ui.Loading.open();
      }
      this.$content.html(this.tplContent({}));
      this.$content.removeClass('hide').addClass('show');
      if (!self.flag.init) {
        _.delay(function () {
          ui.Loading.close();
        }, 200);
      }
      self.flag.init = false;
    },
    initialize: function () {
      this.$content = this.$el.find('.content');
      return this.render();
    }
  });
  module.exports = PublishView;
});
