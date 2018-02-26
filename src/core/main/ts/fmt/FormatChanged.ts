/**
 * FormatChanged.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import Env from 'tinymce/core/api/Env';
import FormatUtils from './FormatUtils';
import MatchFormat from './MatchFormat';
import Tools from '../api/util/Tools';

const each = Tools.each;

const setup = function (formatChangeData, editor) {
  const currentFormats = {};

  formatChangeData.set({});

  editor.on('NodeChange', function (e) {
    let parents = FormatUtils.getParents(editor.dom, e.element);
    const matchedFormats = {};

    // Ignore bogus nodes like the <a> tag created by moveStart()
    parents = Tools.grep(parents, function (node) {
      return node.nodeType === 1 && !node.getAttribute('data-mce-bogus');
    });

    // TODO: Убрать это после того, как в оригинальном TinyMCE это будет исправлено -
    // задача 1174390350 https://online.sbis.ru/opendoc.html?guid=3c49ad1e-7aa2-4e11-a8e5-bd2d34b98f69
    // FIXME: несмотря на фикс ошибка повторяется.
    if (parents.length && Env.gecko) {
      // При тройном клике Firefox делает выделение выше по дереву элементов, чем Chrome
      for (var n = parents[0]; n.hasChildNodes() && n.childNodes.length === 1 && n.firstChild.hasChildNodes(); n = parents[0]) {
        parents.unshift(n.firstChild);
      }
    }
    // Check for new formats
    each(formatChangeData.get(), function (callbacks, format) {
      each(parents, function (node) {
        if (editor.formatter.matchNode(node, format, {}, callbacks.similar)) {
          if (!currentFormats[format]) {
            // Execute callbacks
            each(callbacks, function (callback) {
              callback(true, { node, format, parents });
            });

            currentFormats[format] = callbacks;
          }

          matchedFormats[format] = callbacks;
          return false;
        }

        if (MatchFormat.matchesUnInheritedFormatSelector(editor, node, format)) {
          return false;
        }
      });
    });

    // Check if current formats still match
    each(currentFormats, function (callbacks, format) {
      if (!matchedFormats[format]) {
        delete currentFormats[format];

        each(callbacks, function (callback) {
          callback(false, { node: e.element, format, parents });
        });
      }
    });
  });
};

const addListeners = function (formatChangeData, formats, callback, similar) {
  const formatChangeItems = formatChangeData.get();

  each(formats.split(','), function (format) {
    if (!formatChangeItems[format]) {
      formatChangeItems[format] = [];
      formatChangeItems[format].similar = similar;
    }

    formatChangeItems[format].push(callback);
  });

  formatChangeData.set(formatChangeItems);
};

const formatChanged = function (editor, formatChangeState, formats, callback, similar) {
  if (formatChangeState.get() === null) {
    setup(formatChangeState, editor);
  }

  addListeners(formatChangeState, formats, callback, similar);
};

export default {
  formatChanged
};