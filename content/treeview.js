var myApp = angular.module('myApp', []);

var fnMainCtrl = function($scope) {
    $scope.data = {
        text: 'Root',
        items: [{
            text: 'Folder1',
            items: [
                {
                    text: 'Subfolder1',
                    items: []
                }, 
                {
                    text: 'Subfolder2',
                    items: [
                        {
                            text: 'Subsubfolder1',
                            items: []
                        },  
                        {
                            text: 'Subsubfolder2',
                            items: []
                        }
                    ]
                }
            ]
        }, 
        {
            text: 'Folder2',
            items: []
        }]
    };
}

var fnTreeDirective = function($compile, $templateCache) {
    return {
        restrict: 'E',
        scope: false,
        link: function(scope, el, attrs) {

            var self = this;
            
            this.dataPath = attrs.val;
            this.data = scope.$eval(this.dataPath);

            scope.addMember = function(path) {
                var item = scope.browse(path);

                var newMember = ""; // Get newMember from path's input
                if(path === "")
                    newMember = angular.element(document.querySelector("tree > input")).val();
                else
                    newMember = angular.element(document.querySelector("[data-path='" + path + "'] > input")).val();

                item.items.push({
                    text: newMember,
                    items: []
                });
            }

            scope.deleteSubtree = function(path) {
                var item = scope.browse(path);

                if (path !== "") { // Is not root
                    // Build parent path
                    var nPath = path.split("/");
                    if(nPath.length > 0)
                        nPath = nPath.slice(0, nPath.length - 1);

                    nPath = nPath.join("/");

                    var parent = scope.browse(nPath);

                    // Get old index
                    var i = parent.items.indexOf(item);
                    
                    // Copy items to parent
                    item.items.forEach(function(item) {
                        parent.items.splice(i, 0, angular.copy(item));
                        i++;
                    });

                    // Get new index
                    i = parent.items.indexOf(item);

                    parent.items.splice(i, 1);
                }

                item = {};
            }

            var folderTemplate = '<span>{{ browse("{path}").text }}</span> \
                                    <button ng-click="deleteSubtree(\'{path}\')">Delete this</button> \
                                    <input type="text"></input> \
                                    <button ng-click="addMember(\'{path}\')">Add Subfolder</button> \
                                    <ul> \
                                    </ul>';

            // Return data object reference based on path
            scope.browse = function(path) {
                var nPath = new String(path); // Copy String
                
                if(nPath.substr(0, 1) == "/")
                    nPath = nPath.slice(1, nPath.length);

                if(nPath == "") {
                    return self.data;
                }

                nPath = "scope." + self.dataPath + ".items[" + nPath.replace(/\//g, "].items[") + "]";

                return eval(nPath);
            }

            scope.buildRecursive = function(path, element) {
                // Compile and append folder as content
                var template = folderTemplate.replace(/{path}/g, path);
                var isChild = path !== "";

                if(isChild)
                    template = "<li data-path=\"" + path + "\">" + template + "</li>";

                // Append compiled template to element
                element.append($compile(template)(scope));

                // Check if path has subfolders
                var item = scope.browse(path);
                var $ = angular.element; // Alias to angular's jqLite
                if(item.items.length > 0) {
                    item.items.forEach(function(subitem, index) {
                        var parent = isChild ? $(document.querySelector("[data-path='" + path + "'] > ul")) : $(element.find("ul")[0]);

                        scope.buildRecursive(path + "/" + index, parent);
                    });
                }
            }
            
            // Build DOM tree based on "data" structure
            scope.buildTree = function() {
                el.html("");

                scope.buildRecursive("", el);
            }

            // Rebuild DOM tree whenever "data" changes
            scope.$watch(this.dataPath, scope.buildTree, true);
        }
    }
}

myApp.controller('MainCtrl', fnMainCtrl)
     .directive('tree', fnTreeDirective);
