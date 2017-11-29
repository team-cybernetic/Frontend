/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


var fs = require("fs-extra");

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

const INPUT_DIR = '../build/contracts/';
const OUTPUT_DIR = './build/contracts/';

module.exports = function(deployer) {

  var items = fs.readdirSync(OUTPUT_DIR);
  var filesStore = [];

  for (var i = 0; i < items.length; i++) {
    if (items[i].endsWith('.json')) {
      filesStore.push({
        name: items[i].slice(0, -5),
        requirename: INPUT_DIR + items[i],
        outputname: OUTPUT_DIR + items[i],
        obj: {},
      });
    }
  }

  var files = Object.keys(filesStore);
  for (var f = 0; f < files.length; f++) {
    filesStore[files[f]].obj = require(filesStore[files[f]].requirename);
    console.log("  Creating linked_binary for", filesStore[files[f]].name);
    var linked_binary = filesStore[files[f]].obj.unlinked_binary;
    var networks = filesStore[files[f]].obj.networks;
    var networkKeys = Object.keys(filesStore[files[f]].obj.networks);
    for (var i = 0; i < networkKeys.length; i++) {
      var network = networks[networkKeys[i]];
      console.log("    Checking for links on network", networkKeys[i]);
      var links = network.links;
      var linkKeys = Object.keys(links);
      for (var j = 0; j < linkKeys.length; j++) {
        console.log("      Linking with", linkKeys[j], "(" + links[linkKeys[j]] + ")");
        var addr = links[linkKeys[j]].slice(2);
        var fillerLength = (40 - linkKeys[j].length - 2);
        var regexText = "__" + escapeRegExp(linkKeys[j]) + (fillerLength > 0 ? "_{" + fillerLength + "}" : "");
        linked_binary = linked_binary.replace(new RegExp(regexText, 'g'), addr);
      }
      filesStore[files[f]].obj.networks[networkKeys[i]].linked_binary = linked_binary;
    }
    var final_content = JSON.stringify(filesStore[files[f]].obj, null, 2);
    fs.outputFile(filesStore[files[f]].outputname, final_content, "utf8", function(err) {
      if (err) {
        console.error("Error while re-saving file " + filesStore[files[f]].outputname + ": ", err);
      }
    });
  }
}
