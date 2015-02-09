"use strict";

var mmm = require('mmmagic');
var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
magic.detectFile('./uploads/54016913b07c965449b30ba0cfb279196c87708a.bin', console.log);
magic.detectFile('/home/maxim/Pictures/Bright_red_tomato_and_cross_section02.jpg', console.log);