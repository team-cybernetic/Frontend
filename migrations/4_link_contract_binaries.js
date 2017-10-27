var fs = require("fs-extra");

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

module.exports = function(deployer) {
  var filesStore = {
    PostLib: {
      requirename: '../build/contracts/PostLib.json', //requires happen from the migrations folder...
      outputname: './build/contracts/PostLib.json', //but writes happen from its parent
      obj: {},
    },
    Group: {
      requirename: '../build/contracts/Group.json', //requires happen from the migrations folder...
      outputname: './build/contracts/Group.json', //but writes happen from its parent
      obj: {},
    },
  };
  var files = Object.keys(filesStore);
  for (var f = 0; f < files.length; f++) {
    filesStore[files[f]].obj = require(filesStore[files[f]].requirename);
    var linked_binary = filesStore[files[f]].obj.unlinked_binary;
    var networks = filesStore[files[f]].obj.networks;
    var networkKeys = Object.keys(filesStore[files[f]].obj.networks);
    for (var i = 0; i < networkKeys.length; i++) {
      var network = networks[networkKeys[i]];
      var links = network.links;
      var linkKeys = Object.keys(links);
      for (var j = 0; j < linkKeys.length; j++) {
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
