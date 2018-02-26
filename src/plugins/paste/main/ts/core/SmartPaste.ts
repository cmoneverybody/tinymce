/**
 * SmartPaste.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import Tools from 'tinymce/core/api/util/Tools';
import Settings from '../api/Settings';
import { Editor } from 'tinymce/core/api/Editor';

const pasteHtml = function (editor: Editor, html: string) {
  editor.insertContent(html, {
    merge: Settings.shouldMergeFormats(editor),
    paste: true
  });

  return true;
};

/**
 * Tries to be smart depending on what the user pastes if it looks like an url
 * it will make a link out of the current selection. If it's an image url that looks
 * like an image it will check if it's an image and insert it as an image.
 *
 * @class tinymce.pasteplugin.SmartPaste
 * @private
 */
// TODO Добавили символ ; сами, в соответствии со стандартом https://tools.ietf.org/html/rfc3986, он входит в список разрешенных
// https://online.sbis.ru/opendoc.html?guid=bc3cde8f-909b-4cef-834a-9d63ded2499d
const isAbsoluteUrl = function (url: string) {
  return /^https?:\/\/[\w\?\-\/+=.;&%@~#]+$/i.test(url);
};

const isImageUrl = function (url: string) {
  return isAbsoluteUrl(url) && /.(gif|jpe?g|png)$/.test(url);
};

const createImage = function (editor: Editor, url: string, pasteHtmlFn: typeof pasteHtml) {
  editor.undoManager.extra(function () {
    pasteHtmlFn(editor, url);
  }, function () {
    editor.insertContent('<img src="' + url + '">');
  });

  return true;
};

const createLink = function (editor: Editor, url: string, pasteHtmlFn: typeof pasteHtml) {
  editor.undoManager.extra(function () {
    pasteHtmlFn(editor, url);
  }, function () {
    let
      linkAttr = {
        target: '_blank',
        rel: null,
        'class': null,
        title: null,
        href: url
      };
    editor.execCommand('mceInsertLink', false, linkAttr);
  });

  return true;
};

const linkSelection = function (editor: Editor, html: string, pasteHtmlFn: typeof pasteHtml) {
  return editor.selection.isCollapsed() === false && isAbsoluteUrl(html) ? createLink(editor, html, pasteHtmlFn) : false;
};

const insertImage = function (editor: Editor, html: string, pasteHtmlFn: typeof pasteHtml) {
  //Чтобы по ctrl+v не вставлялась картинка
  return false;
  // return isImageUrl(html) ? createImage(editor, html, pasteHtmlFn) : false;
};

const smartInsertContent = function (editor: Editor, html: string) {
  Tools.each([
    linkSelection,
    insertImage,
    pasteHtml
  ], function (action) {
    return action(editor, html, pasteHtml) !== true;
  });
};

const insertContent = function (editor: Editor, html: string) {
  if (Settings.isSmartPasteEnabled(editor) === false) {
    pasteHtml(editor, html);
  } else {
    smartInsertContent(editor, html);
  }
};

export default {
  isImageUrl,
  isAbsoluteUrl,
  insertContent
};