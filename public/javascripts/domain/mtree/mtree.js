/**
 * Created by tp on 2016/8/4.
 */

var ctrlDown = false,
    ctrlKey = 17,
    cmdKey = 91,
    vKey = 86,
    cKey = 67;
var pointUUID = -1;

var intervalRealTime = -1;

var data = null;
var $table = $('#table')
var tree = $('#jqxTree');
var sourceItem = null;
var tempKey = 0;
var mtreeId = 1;
$(document).keydown(function (e) {
    if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = true;
}).keyup(function (e) {
    if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = false;
});
var tableColumns = [{
    field: 'state',
    checkbox: true
}, {
    field: 'UD',
    title: 'UD',
    align: 'center',
    valign: 'middle',
    visible: false,
}, {
    field: 'GN',
    title: '点名',
    align: 'center',
    valign: 'middle',
    width: '20%',
}, {
    field: 'ID',
    title: '点ID',
    align: 'center',
    visible: false,
    valign: 'middle',
}, {
    field: 'UNIT',
    title: '单位',
    align: 'center',
    visible: false,
    width: '10%',
    valign: 'top',
}, {
    field: 'RT',
    title: '点类型',
    align: 'center',
    valign: 'top',
    formatter: 'formatPointType',
    width: '6%'
}, {
    field: 'ED',
    title: '描述',
    align: 'center',
    valign: 'top',
    width: '20%',
}, {
    field: 'AV',
    title: '实时值',
    align: 'center',
    valign: 'top',
    width: '6%',
    formatter: 'toDecimal'
}, {
    field: 'TM',
    title: '最后更新时间',
    align: 'center',
    valign: 'top',
    width: '18%',
    formatter: 'timeFormatter'
}, {
    field: 'DS',
    title: '质量',
    align: 'center',
    valign: 'top',
    width: '8%',
    formatter: 'getQuality'
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    width: '12%',
    formatter: 'operateFormatter'
}];

/**
 关闭添加点信息对话框
 */
function closePointModal() {
    refresh(); //清空模板信息
    $("#addPointModal").modal('hide');
}

function successSwal(message, timer) {
    swal({
        title: "提示",
        text: message ? message : "操作成功！",
        // type: "info",
        type: "success",
        timer: timer ? timer : 1500,
        closeOnConfirm: false
    });
}

function errorSwal(message) {
    swal({
        title: "错误",
        text: message ? message : "操作失败！",
        type: "error",
        timer: 2000,
        closeOnConfirm: false
    });
}

function confirmSwal(callback) {
    swal({
        title: "删除确认?",
        text: "您希望删除当前选择数据?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        closeOnConfirm: false,
        closeOnCancel: true
    }, function (isConfirm) {
        if (isConfirm) {
            callback();
        }
    });
}

var contextMenu;
$(document).ready(function () {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "1000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    //添加测点到快照-------start
    getPointGroupList();
    $('.pointCO').colorpicker({
        format: "hex"
    }).on('changeColor', function (e) {
        var color = e.color.toHex();
        $(this).css('background-color', color);
    });
    //添加测点到快照-------end
    var flag = true;
    $("#bt").click(function () {
        if (flag) {
            $(".col-md-3").hide();
            $(".col-md-9").width("1100px");
            flag = false;
            initTable();
        } else {
            $(".col-md-3").show();
            $(".col-md-9").width("800px");
            flag = true;
            initTable();
        }
    });
    initJTree();
    initTable();
});

//初始化Mtree信息
function initJTree() {
    contextMenu = $("#jqxMenu").jqxMenu({
        width: '75px',
        height: getMenuHeight(),
        autoOpenPopup: false,
        mode: 'popup'
    });
    addCopyEvent();
    attachContextMenu();
    $("#jqxMenu").on('itemclick', function (event) {
        var item = $.trim($(event.args).text());
        switch (item) {
            case "刷新":
                refreshItem()
                break;
            case "创建":
                clickAdd()
                break;
            case "编辑":
                clickEdit()
                break;
            case "删除":
                clickRemove()
                break;
            case "重命名":
                clickRename()
                break;
            case "剪切":
                cutItem()
                break;
            case "复制":
                copyItem()
                break;
            case "粘贴":
                pasteItem()
                break;
            case "超链接":
                clickLink()
                break;
        }
    });
    // disable the default browser's context menu.
    $(document).on('contextmenu', function (e) {
        if ($(e.target).parents('.jqx-tree').length > 0) {
            return false;
        }
        return true;
    });
    tree.on('select', function (event) {
        var args = event.args;
        var item = tree.jqxTree('getItem', args.element);
        mtreeId = item.id;
        queryPoint();
    });
    initTree();
    if (isMobile.any()) {
        //是移动设备
        $table.toggleView
    }
}

var pasteType = "copy";

function copyItem() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem.value == 1) {
        errorSwal('域节点不允许复制');
        return;
    }
    if (sourceItem && sourceItem.element) {
        tree.jqxTree('enableItem', sourceItem.element);
    }
    pasteType = "copy";
    sourceItem = selectedItem;
    successSwal("“" + selectedItem.label + "”已复制");
}

function cutItem() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem.value == 1) {
        errorSwal('域节点不允许剪切');
        return;
    }
    pasteType = "cut";
    if (sourceItem && sourceItem.element) {
        tree.jqxTree('enableItem', sourceItem.element);
    }
    sourceItem = selectedItem;
    tree.jqxTree('disableItem', selectedItem.element);
    successSwal("“" + sourceItem.label + "”已选中");
}
/**
 * 刷新节点
 */
function refreshItem() {
    var selectedItem = tree.jqxTree('selectedItem');
    var $element = $(selectedItem.element);
    $element.find('ul').empty();
    $.ajax({
        type: "POST",
        dataType: 'json',
        url: "/domain/mtree/MtreeJson",
        data: {
            "id": selectedItem.id
        },
        success: function (result) {
            if (result.length > 0) {
                var records1 = bindDataRecords(result);
                tree.jqxTree('addTo', records1, $element[0]);
                tree.jqxTree('render');
                tree.jqxTree('expandItem', selectedItem.element);
            }
        }
    });
    tree.jqxTree('expandItem', selectedItem.element);
}

/**
 * 刷新节点
 */
function refreshItemById(parentID) {
    var treeItems = tree.jqxTree('getItems');
    var itemElement;
    for (var i in treeItems) {
        if (treeItems[i].id == parentID) {
            itemElement = treeItems[i];
            break;
        }
    }

    var $element = $(itemElement.element);
    $element.find('ul').empty();
    $.ajax({
        type: "POST",
        dataType: 'json',
        url: "/domain/mtree/MtreeJson",
        data: {
            "id": parentID
        },
        success: function (result) {
            if (result.length > 0) {
                var records1 = bindDataRecords(result);
                tree.jqxTree('addTo', records1, $element[0]);
                tree.jqxTree('render');
                tree.jqxTree('expandItem', itemElement.element);
            }
        }
    });
    tree.jqxTree('expandItem', itemElement.element);
}
/**
 * 粘贴
 */
function pasteItem() {
    if (sourceItem && sourceItem.id && sourceItem.id != "") {
        var selectedItem = tree.jqxTree('selectedItem');
        if (selectedItem.id == sourceItem.id) {
            //TODO 粘贴动作是否允许粘贴给自己
            errorSwal("不允许粘贴到自己");
            return;
        } else {
            var items = tree.jqxTree('getItems');
            var itemsMap = new Object();
            items.forEach(function (item) {
                itemsMap[item.id] = item;
            });
            //获取当前选择对象的父节点，进行父目录递归
            var item = selectedItem;
            for (; true;) {
                var parentId = itemsMap[item.id].parentId;
                if (parentId && parentId != null) {
                    item = itemsMap[parentId]
                    if (item.id == sourceItem.id) {
                        errorSwal("目的节点是粘贴节点的子节点");
                        return;
                    }
                } else {
                    break;
                }
            }
            swal({
                title: "新名称",
                text: "请输入新名称:",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: sourceItem.label
            }, function (inputValue) {
                if (inputValue === false)
                    return false;
                if (inputValue && inputValue.trim() !== "") {
                    $.ajax({
                        type: 'POST',
                        url: "/domain/mtree/copyMTree",
                        data: {
                            sourceID: sourceItem.id,
                            targetID: selectedItem.id,
                            targetPID: selectedItem.parentId,
                            newName: inputValue,
                            pasteType: pasteType
                        },
                        success: function (data) {
                            if (data.flag < 0) {
                                errorSwal(data.message);
                                if (sourceItem && sourceItem.element) {
                                    tree.jqxTree('enableItem', sourceItem.element);
                                }
                                return;
                            } else {
                                if (pasteType == "cut") {
                                    tree.jqxTree('removeItem', sourceItem.element, false);
                                    tree.jqxTree('render');
                                    successSwal("“" + sourceItem.label + "”" + "剪切到" + "“" + selectedItem.label + "”下" + "成功");
                                    refreshItem();
                                } else if (pasteType == "copy") {
                                    //TODO 重新加载结构
                                    successSwal("“" + sourceItem.label + "”" + "粘贴到" + "“" + selectedItem.label + "”下" + "成功");
                                    refreshItem();
                                }
                            }
                        },
                        error: function (data) {
                            errorSwal();
                        },
                        dataType: "json"
                    });
                    return true
                } else {
                    swal.showInputError("无效数据!");
                    return false
                }
            });
        }
    } else {
        errorSwal("请复制节点");
    }
}

function addCopyEvent() {
    $("#jqxTree").on('keydown', function (e) {
        if (ctrlDown && (e.keyCode != tempKey && e.keyCode == vKey)) {
            tempKey = e.keyCode;
            pasteItem();
            return false;
        } else if (ctrlDown && (e.keyCode != tempKey && e.keyCode == cKey)) {
            tempKey = e.keyCode;
            copyItem()
            return false;
        } else {
            tempKey = e.keyCode;
        }
    });
}


var getMenuHeight = function () {
    return ($("#jqxMenu li[type!='separator']").size() * 26) + ($("#jqxMenu li[type='separator']").size() * 4) + 'px';
};


var attachContextMenu = function () {
    $("#jqxTree").on('mousedown', function (event) {
        var target = $(event.target).parents('li:first')[0];
        var rightClick = isRightClick(event);
        if (rightClick && target != null) {
            $("#jqxTree").jqxTree('selectItem', target);
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
            return false;
        }
    });
}

function isRightClick(event) {
    var rightclick;
    if (!event) var event = window.event;
    if (event.which) rightclick = (event.which == 3);
    else if (event.button) rightclick = (event.button == 2);
    return rightclick;
}

/**
 * 新增
 */
function clickAdd() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        if (selectedItem.value == 1) {
            $.ajax({
                url: '/domain/mtree/canAdd',
                type: 'post',
                data: {
                    id: selectedItem.id
                },
                dataType: 'json',
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                        return;
                    } else {
                        $('#TreeModal_NAME').val('');
                        $('#TreeModal_DESCRIPTION').val('');
                        $('#TreeModal').modal('show');
                    }
                },
                error: {}
            });

        } else {
            $('#TreeModal_NAME').val('');
            $('#TreeModal_DESCRIPTION').val('');
            $('#TreeModal').modal('show');
        }
    } else {
        errorSwal("请选择父节点");
    }
}
/**
 * 编辑
 */
function clickEdit() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        if (selectedItem.level == 0) {
            errorSwal("根节点不允许编辑");
        } else if (selectedItem.value == 1) {
            errorSwal("域节点不允许编辑");
        } else {
            initEditTreeModal(selectedItem);
        }
    } else {
        errorSwal("请选择节点");
    }
}

/*编辑节点的时候显示*/
function initEditTreeModal(selectedItem) {
    var itemID = selectedItem.id;
    $.ajax({
        url: '/domain/mtree/getMTree',
        type: 'post',
        data: {
            mtreeID: itemID
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                var data = data.data;
                $('#editTreeModalID').val(itemID);
                $('#editTreeModalName').val(data.name);
                $('#editTreeModalDESCRIPTION').val(data.description);
                $('#TreeEditModal').modal('show');
            }

        },
        error: {}
    })
}
/*更新节点*/
function editItem() {
    var itemID = $('#editTreeModalID').val();
    var itemDescription = $('#editTreeModalDESCRIPTION').val();
    $.ajax({
        url: '/domain/mtree/updateMTree',
        type: 'post',
        data: {
            mtreeID: itemID,
            mtreeDesc: itemDescription
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                $('#editTreeModalID').val('');
                $('#editTreeModalName').val('');
                $('#editTreeModalDESCRIPTION').val('');
                $('#TreeEditModal').modal('hide');
                successSwal();
            }
        },
        error: {}
    })
}

/**
 * 重命名
 */
function clickRename() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem.level == 0) {
        errorSwal("根节点不允许重命名");
        return;
    }
    if (selectedItem.value == 1) {
        errorSwal("域节点不允许重命名");
        return;
    }
    swal({
        title: "重命名",
        text: "请输入新名称:",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: selectedItem.label
    }, function (inputValue) {
        if (inputValue === false) return false;
        if (inputValue && inputValue.trim() !== "") {
            $.ajax({
                type: 'POST',
                url: "/domain/mtree/renameMTree",
                data: {
                    id: selectedItem.id,
                    newName: inputValue
                },
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                    } else {
                        tree.jqxTree('updateItem', {
                            icon: '/images/mtree.png',
                            label: inputValue
                        }, selectedItem.element);
                        tree.jqxTree('render');
                        queryPoint();
                        successSwal();
                    }
                },
                error: function (data) {
                    errorSwal();
                },
                dataType: "json"
            });
            return true
        } else {
            swal.showInputError("无效数据!");
            return false
        }
    });
}

/*删除节点*/
function clickRemove() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        if (selectedItem.level == 0) {
            errorSwal("根节点不允许删除");
        } else if (selectedItem.value == 1) {
            errorSwal("域节点不允许删除");
        } else if (selectedItem.value == 3 || selectedItem.value == 4) {
            errorSwal("盒子和采集节点，不允许删除");
        } else {
            confirmSwal(function () {
                var id = selectedItem.id;
                deleteMtree(id, selectedItem);
            });
        }
    } else {
        errorSwal("请选择节点");
    }
}

function clickLink() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        $.ajax({
            type: 'POST',
            url: '/domain/mtree/linkMTreeInfo',
            dataType: 'json',
            async: false,
            data: {
                id: selectedItem.id
            },
            success: function (value) {
                if (value.flag < 0) {
                    toastr.warning(value.message);
                    return;
                } else {
                    $('#LinkModal').modal('show');
                    var data = value.data;
                    //创建下拉按钮
                    $('#dropDownButton').jqxDropDownButton({
                        width: '100%'
                    });
                    //初始提示为：请选择
                    var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">请选择</div>';
                    $('#dropDownButton').jqxDropDownButton('setContent', dropDownContent);
                    //准备下拉列表数据
                    initAddPageTable(data);
                }
            },
            error: function () {
                toastr.error('获取信息失败');
            }
        });


    } else {
        errorSwal("请选择节点");
    }
}
/**
 * 关闭linkMTree 界面
 */
function closeLinkMTree() {
    $('#LinkModal').modal('hide');
    $('#linkName').val('');
}
/**
 * 添加 LinkMTree
 */
function addLinkMTree() {
    var linkName = $('#linkName').val();
    if (!linkName) {
        errorSwal("请选择输入链接名称");
        return;
    }
    var selectedItem = tree.jqxTree('selectedItem');
    var targetItem = $("#linkMtree").jstree("get_selected", true); //使用get_checked方法 
    if (!selectedItem || !selectedItem.id) {
        errorSwal("请选择需要链接的节点");
        return;
    }
    if (!targetItem || !targetItem[0].id) {
        errorSwal("请选择链接节点");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/domain/mtree/linkMTree",
        dataType: "json",
        data: {
            linkName: linkName,
            sourceID: targetItem[0].id,
            targetID: selectedItem.id
        },
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                if (data.message > 0) {
                    successSwal();
                    if (selectedItem != null) {
                        var insertID = parseInt(data.message);
                        tree.jqxTree('addTo', {
                            id: insertID,
                            icon: '/images/mtree.png',
                            label: linkName
                        }, selectedItem.element, false);
                        tree.jqxTree('render');
                        tree.jqxTree('expandItem', selectedItem.element);
                    } else {
                        tree.jqxTree('addTo', {
                            id: insertID,
                            icon: '/images/mtree.png',
                            label: linkName
                        }, null, false);
                        tree.jqxTree('render');
                    }
                } else {
                    errorSwal();
                }
            }
        },
        error: function (data) {
            errorSwal();
        }
    });
}


/**
 * 格式化显示 下拉列表信息
 * @param {Object} data
 */
function initAddPageTable(value) {
    $('#linkMtree').jstree({
        'core': {
            'data': value
        }
    });
    $('#linkMtree').on("select_node.jstree", function (node, selected, e) {
        var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">' + selected.node.text + '</div>';
        $("#dropDownButton").jqxDropDownButton('setContent', dropDownContent); //设置下拉框的值
        $("#dropDownButton").jqxDropDownButton('close'); //选中后关闭该下拉框
    });
}

function addItem() {
    var selectedItem = tree.jqxTree('selectedItem');
    var NAME = $('#TreeModal_NAME').val();
    var DESCRIPTION = $('#TreeModal_DESCRIPTION').val();
    var PID = null;
    if (selectedItem != null) {
        PID = selectedItem.id;
        $.ajax({
            type: 'POST',
            url: "/domain/mtree/createMTree",
            data: {
                NAME: NAME,
                DESCRIPTION: DESCRIPTION,
                PID: PID,
            },
            success: function (data) {
                if (data.flag < 0) {
                    errorSwal(data.message);
                } else {
                    var insertID = parseInt(data.data);
                    successSwal();
                    if (selectedItem != null) {
                        tree.jqxTree('addTo', {
                            id: insertID,
                            icon: '/images/mtree.png',
                            label: NAME
                        }, selectedItem.element, false);
                        tree.jqxTree('render');
                        tree.jqxTree('expandItem', selectedItem.element);
                    } else {
                        tree.jqxTree('addTo', {
                            id: insertID,
                            icon: '/images/mtree.png',
                            label: NAME
                        }, null, false);
                        // update the tree.
                        tree.jqxTree('render');
                    }
                }
            },
            error: function (data) {
                errorSwal();
            },
            dataType: "json"
        });
    } else {
        errorSwal("请选择节点");
    }
}

function deleteMtree(id, selectedItem) {
    $.ajax({
        type: 'POST',
        url: "/domain/mtree/removeMTree",
        data: {
            treeId: id,
        },
        success: function (data) {
            if (data.flag < 0) {
                errorSwal();
            } else {
                successSwal("删除成功");
                tree.jqxTree('removeItem', selectedItem.element, false);
                // update the tree.
                tree.jqxTree('render');
                selectedItem = null;
            }
        },
        error: function (data) {
            errorSwal()
        },
        dataType: "json"
    });
}


$(window).resize(function () {
    $("#jqxTree").height(getHeight4());
    $table.bootstrapTable('resetView', {
        height: getHeight2()
    });
});

function bindDataRecords(data) {
    var dataAdapter = new $.jqx.dataAdapter({
        datatype: "json",
        datafields: [{
            name: 'id'
        }, {
            name: 'parentid'
        }, {
            name: 'icon'
        }, {
            name: 'NAME'
        }, {
            name: 'value'
        }, {
            name: 'disabled',
            type: 'bool'
        }],
        id: 'id',
        localdata: data
    });
    dataAdapter.dataBind();
    var records = dataAdapter.getRecordsHierarchy('id', 'parentid', 'items', [{
        name: 'NAME',
        map: 'label',
    }]);
    return records;
}

function ajaxLoadTree(event) {
    var $element = $(event.args.element);
    var loader = true;
    var loaderItem = null;
    var selectedItem = tree.jqxTree('selectedItem');
    var children = $element.find('ul:first').children();
    $.each(children, function () {
        var item = tree.jqxTree('getItem', this);
        if (item && item.label == 'Loading...') {
            loaderItem = item;
            loader = true;
            return false
        }
    });
    if (loader && loaderItem && loaderItem.parentId) {
        $.ajax({
            type: "POST",
            dataType: 'json',
            url: "/domain/mtree/MtreeJson",
            data: {
                "id": loaderItem.parentId
            },
            success: function (result) {
                var records1 = bindDataRecords(result);
                tree.jqxTree('addTo', records1, $element[0]);
                tree.jqxTree('removeItem', loaderItem.element);
            }
        });
    }
}


function initTree() {
    $.ajax({
        type: "POST",
        dataType: 'json',
        url: "/domain/mtree/MtreeJson",
        success: function (data) {
            var records = bindDataRecords(data);
            tree.jqxTree({
                allowDrag: true,
                allowDrop: true,
                source: records,
                width: '100%',
                height: getHeight4(),
                dragStart: function (item) {
                    if (!item.parentId) {
                        errorSwal('根节点不允许拖动');
                        return false;
                    }
                    if (item.disabled) {
                        errorSwal('该节点不允许拖拽');
                        return false;
                    }
                },
                dragEnd: function (item, dropItem, args, dropPosition, tree) {
                    if (dropPosition == 'before' && !dropItem.parentId) {
                        errorSwal("不允许拖拽根节点外");
                        return false;
                    }
                    var parentID = item.parentId;
                    var targetId, sourceId = item.id,
                        orderId;
                    if (dropPosition == 'inside') {
                        targetId = dropItem.id
                        orderId = 0;
                    } else {
                        targetId = dropItem.parentId;
                        orderId = dropItem.id
                    }
                    if (!sourceId || !targetId) {
                        errorSwal('请选择要拖动的节点');
                        return false;
                    }
                    if (sourceId == targetId) {
                        errorSwal('不允许拖拽给自己');
                        return false;
                    }
                    if ((item.value == 1) && targetId != parentID) {
                        errorSwal('域拖拽只能在同一上级节点下');
                        return false;
                    }
                    $.ajax({
                        type: 'POST',
                        url: "/domain/mtree/dragMTree",
                        data: {
                            sourceID: sourceId,
                            targetID: targetId,
                            dropPosition: dropPosition,
                            orderId: orderId
                        },
                        success: function (data) {
                            if (data.flag < 0) {
                                tree.jqxTree('removeItem', item);
                                errorSwal(data.message);
                            } else {
                                successSwal('拖拽成功');
                            }
                            refreshItemById(parentID);
                            return true;
                        },
                        error: function (data) {
                            errorSwal();
                        },
                        dataType: "json"
                    });
                }
            });
            tree.on('expand', function (event) {
                ajaxLoadTree(event);
            });
            tree.jqxTree('selectItem', tree.find('li:first')[0]);
        }
    })
}

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

/**
 * 初始化表格
 */
function initTable() {
    $table.bootstrapTable({
        height: getHeight2(),
        columns: tableColumns,
        queryParams: queryParams,
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            swal({
                title: "加载异常",
                text: "数据未正常加载",
                type: "error",
                closeOnConfirm: false
            });
        }
    });
    $('#table').on('page-change.bs.table', function (e, number, size) {
        queryPoint();
    });
    setTimeout(function () {
        $table.bootstrapTable('resetView');
        if (isMobile.any()) {
            $table.bootstrapTable('toggleView');
        }
    }, 200);
}
/*格式化操作组*/
function operateFormatter(value, row, index) {
    return [
        '<a class="remove" href="javascript:void(0)" onclick ="deletePointOperator(\'' + row.ID + '\',\'' + row.ID + '\',\'' + row.UD + '\')" title="删除" style="color:#e30000">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>' + "&nbsp;&nbsp;" +
        '<a class="edit" href="javascript:void(0)" onclick ="editPointOperator(\'' + row.ID + '\',\'' + row.ID + '\',\'' + row.UD + '\')" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>' + "&nbsp;&nbsp;" +
        '<a class="addSnap" href="javascript:void(0)" onclick ="addPointToSnapOperator(\'' + row.ID + '\',\'' + row.GN + '\')" title="添加" style="color:#f0a55">',
        '<i class="glyphicon glyphicon-leaf"></i>',
        '</a>'
    ].join('');
}

/*删除点*/
function deletePointOperator(ID, pointID, UUID) {
    confirmSwal(function () {
        if (ID) {
            removePoint(ID, pointID, UUID);
        }
    });
}

/*编辑点*/
function editPointOperator(ID, pointID, UUID) {
    if (ID) {
        showEditModal(ID, pointID, UUID);
    }
}

/*添加到点组*/
function addPointToSnapOperator(pointID, pointName) {
    $("#addPointToSnapModal").modal('show');
    $('#isBatch').val('0');
    $("#pointIdHidden").val(pointID);
    $("#pointNameHidden").val(pointName);
}
//添加到点组
function addPointToSnap() {
    var isBatch = $('#isBatch').val();
    if (isBatch == '1') {
        batchToGroup();
    } else {
        addPointTogroup();
    }
}
function addPointTogroup() {
    var pointId = $("#pointIdHidden").val();
    var pointName = $("#pointNameHidden").val();
    var groupId = $('#pointGoroupSelect').val();
    var groupName = $('#pointGoroupSelect').find('option[value="' + groupId + '"]').text();
    if (groupId <= 0) {
        errorSwal("请选择所需要添加的点组!");
        return;
    }
    $.ajax({
        type: "post",
        url: "/domain/mtree/addPointToGroup",
        data: {
            pointId: pointId,
            pointName: pointName,
            groupId: groupId,
            groupName: groupName
        },
        async: false,
        dataType: "json",
        success: function (message) {
            if (message.flag < 0) {
                errorSwal(message.message);
                return;
            }
            successSwal();
            closePointToSnap();
        },
        error: function () {
            errorSwal("数据加载失败!");
        }
    });
}
/*添加到点组*/
function batchAddPointToSnapOperator() {
    $("#addPointToSnapModal").modal('show');
    $('#isBatch').val('1');
}
/**
 * 批量添加到点组
 */
function batchToGroup() {
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要添加的行！");
        return;
    }
    var ids = [];
    var pns = [];
    for (var i = 0; i < rows.length; i++) {
        ids[i] = rows[i].ID;
        pns[i] = rows[i].GN;
    }
    var groupId = $('#pointGoroupSelect').val();
    var groupName = $('#pointGoroupSelect').find('option[value="' + groupId + '"]').text();
    if (groupId <= 0) {
        errorSwal("请选择所需要添加的点组!");
        return;
    }
    $.ajax({
        type: "post",
        url: "/domain/mtree/batchAddPointToGroup",
        data: {
            pointIds: ids.join(','),
            pns: pns.join(','),
            groupId: groupId,
            groupName: groupName
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                closePointToSnap();
                successSwal();
            }
        },
        error: function () {
            errorSwal("添加失败！");
        }
    });
}
/**
 * 关闭添加到点组对话框
 */
function closePointToSnap() {
    $('#pointGoroupSelect').selectpicker('val', -1);
    $("#addPointToSnapModal").modal('hide');
}
//页面modal加载点组信息
function getPointGroupList() {
    $.ajax({
        type: "post",
        url: "/domain/mtree/pointGroupList",
        data: {
            time: new Date().getTime()
        },
        async: false,
        dataType: "json",
        success: function (message) {
            if (message.flag < 0) {
                errorSwal(message.message);
                return;
            }
            var data = message.data;
            var html = '';
            for (var i in data) {
                var obj = data[i];
                html += '<option value="' + obj.ID + '">' + obj.GROUP_NAME + '</option>';
            }
            html = '<option value="-1">请选择</option>' + html;
            $('#pointGoroupSelect').html(html).selectpicker('refresh');
        },
        error: function () {
            errorSwal("数据加载失败!");
        }
    });
}

function queryParams(params) {
    var selectedItem = tree.jqxTree('selectedItem');
    treeID = null;
    if (selectedItem && selectedItem.id > 0) {
        treeID = selectedItem.id
    }
    return {
        pageSize: params.limit,
        pageNumber: params.pageNumber,
        treeID: params.treeID ? params.treeID : treeID
    };
}

function queryPoint() {
    socket.removeAllListeners('projectPoint/pointInfoRealTime');
    socket.on('projectPoint/pointInfoRealTime', function (data) {
        if (data.value.total == 0) {
            $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
        }
        $('#table').bootstrapTable('load', data.value);
    });
    treeRefresh();
}

function queryPointRefresh() {
    var selectedItem = tree.jqxTree('selectedItem');
    var id = selectedItem.id;
    var opts = $("#table").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    var search = opts.search;
    var pageData = {
        'offset': offset,
        'limit': limit,
        'treeID': id,
        'search': search
    }
    socket.emit('projectPoint/pointInfoRealTime', pageData);
}

/*tree 点击刷新*/
function treeRefresh() {
    var selectedItem = tree.jqxTree('selectedItem');
    var id = selectedItem.id;
    var opts = $("#table").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    var search = opts.search;
    var pageData = {
        'offset': offset,
        'limit': limit,
        'treeID': id,
        'search': search
    }
    var flag = $('#startRefresh').html();
    if (flag == '刷新') {
        socket.emit('projectPoint/pointInfoRealTime', pageData);
    } else {
        clearInterval(intervalRealTime);
        intervalRealTime = setInterval(function () {
            socket.emit('projectPoint/pointInfoRealTime', pageData);
        }, 1000);
    }
}
/*开始刷新*/
function startRefresh() {
    var selectedItem = tree.jqxTree('selectedItem');
    var id = selectedItem.id;
    var opts = $("#table").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    var search = opts.search;
    var pageData = {
        'offset': offset,
        'limit': limit,
        'treeID': id,
        'search': search
    }
    var flag = $('#startRefresh').html();
    if (flag == '刷新') {
        intervalRealTime = setInterval(function () {
            socket.emit('projectPoint/pointInfoRealTime', pageData);
        }, 1000);
        $('#startRefresh').html('停止');
        $('#startRefresh').removeClass('btn-success').addClass('btn-warning');
    } else {
        socket.emit('projectPoint/pointInfoRealTime', pageData);
        clearInterval(intervalRealTime);
        $('#startRefresh').html('刷新');
        $('#startRefresh').removeClass('btn-warning').addClass('btn-success');
    }
}


function showAddModal() {
    refresh(); //清空模板信息
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem == null) {
        errorSwal("请选择节点！");
        return;
    }
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        if (selectedItem.value == 1) {
            $.ajax({
                url: '/domain/mtree/canAdd',
                type: 'post',
                data: {
                    id: selectedItem.id
                },
                dataType: 'json',
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                        return;
                    } else {
                        $('#pointRT').on('hide.bs.select', function (e) {
                            var type = $('#pointRT').selectpicker('val');
                            if (type == '1') {
                                $('.pointAX').hide();
                                $('.pointDX').css({
                                    'display': 'flex',
                                    'align-items': 'center'
                                });
                            } else {
                                $('.pointAX').show();
                                $('.pointDX').hide();
                            }
                        });
                        $('#pointTitle').html(' 添加测点');
                        $("#addPointModal").modal('show');
                        $('#pointManageTitle').html('添加测点');
                    }
                },
                error: {}
            });

        } else {
            $('#pointTitle').html(' 添加测点');
            $("#addPointModal").modal('show');
            $('#pointManageTitle').html('添加测点');
        }
    } else {
        errorSwal("请选择父节点");
    }
}

/*删除单个点*/

function removePoint(id, pointID, UUID) {
    $.ajax({
        type: "post",
        url: "/domain/mtree/removePoint",
        data: {
            id: id,
            pointID: pointID,
            UUID: UUID
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                successSwal("数据删除成功！");
                queryPointRefresh();
            }
        },
        error: function () {
            errorSwal("数据删除失败！");
        }
    });
}
/*批量删除点*/

function batchDelete() {
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要删除的行！");
        return;
    }
    confirmSwal(function () {
        var ids = [];
        var UUIDs = [];
        var pointPNs = [];
        for (var i = 0; i < rows.length; i++) {
            ids[i] = rows[i].ID;
            UUIDs[i] = rows[i].UD;
            pointPNs[i] = rows[i].GN;
        }
        $.ajax({
            type: "post",
            url: "/domain/mtree/batchRemove_point",
            data: {
                ids: ids.join(','),
                UUIDs: UUIDs.join(','),
                pointPNs: pointPNs.join(',')
            },
            async: false,
            dataType: "json",
            success: function (data) {
                if (data.flag < 0) {
                    errorSwal("数据删除失败！");
                } else {
                    successSwal("数据删除成功！");
                    queryPointRefresh();
                }
            },
            error: function () {
                errorSwal("数据删除失败！");
            }
        });
    });

}

function showEditModal(ID, pointID, UUID) {
    $('#pointTitle').html(' 编辑测点');
    pointUUID = UUID;
    getPointInfo(pointID, UUID);
    $("#addPointModal").modal('show');
    $('#pointManageTitle').html('编辑测点');
}

/**
 * 导入
 */
function showImportFile() {
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem == null) {
        errorSwal("请选择节点！");
        return;
    }
    var selectedItem = tree.jqxTree('selectedItem');
    if (selectedItem != null) {
        if (selectedItem.value == 1) {
            $.ajax({
                url: '/domain/mtree/canAdd',
                type: 'post',
                data: {
                    id: selectedItem.id
                },
                dataType: 'json',
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                        return;
                    } else {
                        $("#mtreeId").val(mtreeId);
                        $("#importModal").modal('show');
                    }
                },
                error: {}
            });
        } else {
            $("#mtreeId").val(mtreeId);
            $("#importModal").modal('show');
        }
    } else {
        errorSwal("请选择父节点");
    }
}

function importFile() {
    var file = $("#resource").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        errorSwal("请选择导入的文件!");
        return;
    } else if ("xls" != ext && "xlsx" != ext) {
        errorSwal("只能导入Excle文件!");
        return;
    }
    $('#uploadForm').ajaxSubmit({
        url: '/domain/mtree/importFile',
        dataType: "json",
        data: {
            "mtreeId": mtreeId
        },
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                queryPointRefresh();
                successSwal("导入成功！");
            }
        },
        before: function () {
            $('#importModal').modal('hide');
        }
    });
    return;
}

/*
 压缩类型格式化
 */
function formatCompressType(value, row, index) {
    if (row.COMPRESS_TYPE == 1) {
        return "自动";
    }
    return "无压缩";
}

/*
 点的类型格式化
 */
function formatPointType(value, row, index) {
    var value = row.RT;
    switch (value) {
        case 0:
            return '模拟量';
        case 1:
            return '数字量';
        case 2:
            return '短整数';
        case 3:
            return '长整数';
        case 4:
            return '浮点型';
        default:
            return '模拟量';
    }
}

function showImage() {
    $('#imageModal').modal('show');
}

function close() {
    $('#importModal').modal('hide');
}

function addOrUpdatePoint() {
    var pointID = $('#pointID').val();
    if (pointID) {
        updateProjectPoint();
    } else {
        addProjectPoint();
    }
}
/*
 获取测点信息
 */
function getPointInfo(pointID) {
    if (!pointID) {
        toastr.warning('请选择点');
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/domain/mtree/getPointInfo",
        dataType: "json",
        data: {
            pointID: pointID
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                var point = data.data[0];
                $('#pointID').val(point.ID);
                $('#pointPN').val(point.TN);
                $("#pointPN").attr("disabled", true);
                $('#pointRT').selectpicker('val', point.RT);
                $('#pointRT').prop('disabled', true);
                $('#pointRT').selectpicker('refresh');
                $('#pointED').val(point.ED);
                $('#pointFQ').val(point.FQ);
                $('#pointAN').val(point.AN);
                $('#pointFM').val(point.FM);
                $('#pointTV').val(point.TV);
                $('#pointBV').val(point.BV);
                $('#pointEU').val(point.EU);
                $('#pointKZ').selectpicker('val', point.KZ);
                $('#pointKZ').selectpicker('refresh');
                $('#pointEX').val(point.EX);
                $('#pointPT').selectpicker('val', point.PT);
                $('#pointPT').selectpicker('refresh');
                $('#pointKT').selectpicker('val', point.KT);
                $('#pointKT').selectpicker('refresh');
                $('#pointAP').selectpicker('val', point.AP);
                $('#pointAP').selectpicker('refresh');
                $('#pointCT').val(timeFormatter(point.CT));
                if (point.RT == 1) {
                    $('#pointLC').selectpicker('val', point.LC);
                    $('#pointLC').selectpicker('refresh');
                    $('.pointAX').hide();
                    $('.pointDX').css({
                        'display': 'flex',
                        'align-items': 'center'
                    });
                } else {
                    var LC = point.LC & 255;
                    //高限
                    $("#pointCKH4").prop("checked", (LC >> 7 & 1) == 1);
                    $("#pointCKH3").prop("checked", (LC >> 5 & 1) == 1);
                    $("#pointCKZH").prop("checked", (LC >> 3 & 1) == 1);
                    $("#pointCKHL").prop("checked", (LC >> 1 & 1) == 1);
                    //低限
                    $("#pointCKLL").prop("checked", (LC & 1) == 1);
                    $("#pointCKZL").prop("checked", (LC >> 2 & 1) == 1);
                    $("#pointCKL3").prop("checked", (LC >> 4 & 1) == 1);
                    $("#pointCKL4").prop("checked", (LC >> 6 & 1) == 1);
                    $('#pointH4').val(point.H4);
                    $('#pointH3').val(point.H3);
                    $('#pointZH').val(point.ZH);
                    $('#pointHL').val(point.HL);
                    $('#pointLL').val(point.LL);
                    $('#pointZL').val(point.ZL);
                    $('#pointL3').val(point.L3);
                    $('#pointL4').val(point.L4);
                    $('#C1').val('#' + point.C1.toString(16)).css('background-color', '#' + point.C1.toString(16));
                    $('#C2').val('#' + point.C2.toString(16)).css('background-color', '#' + point.C2.toString(16));
                    $('#C3').val('#' + point.C3.toString(16)).css('background-color', '#' + point.C3.toString(16));
                    $('#C4').val('#' + point.C4.toString(16)).css('background-color', '#' + point.C4.toString(16));
                    $('#C5').val('#' + point.C5.toString(16)).css('background-color', '#' + point.C5.toString(16));
                    $('#C6').val('#' + point.C6.toString(16)).css('background-color', '#' + point.C6.toString(16));
                    $('#C7').val('#' + point.C7.toString(16)).css('background-color', '#' + point.C7.toString(16));
                    $('#C8').val('#' + point.C8.toString(16)).css('background-color', '#' + point.C8.toString(16));
                    $('.pointAX').show();
                    $('.pointDX').hide();
                }
            }
        },
        error: function (data) {
            toastr.warning("操作失败！");
        }

    });
}


/**清空模块，因为先更新后，点击添加功能导致模块**/
function refresh() {
    $('#pointID').val('');
    $('#pointPN').val('');
    $("#pointPN").attr("disabled", false);
    $('#pointRT').selectpicker('val', 0);
    $('#pointRT').prop('disabled', false);
    $('#pointRT').selectpicker('refresh');
    $('#pointED').val('');
    $('#pointAN').val('');
    $('#pointFQ').val(1);
    $('#pointFM').val(2);
    $('#pointTV').val(100);
    $('#pointBV').val(0);
    $('#pointEU').val('');
    $('#pointKZ').selectpicker('val', 1);
    $('#pointKZ').selectpicker('refresh');
    $('#pointEX').val('');
    $('#pointPT').selectpicker('val', 0);
    $('#pointPT').selectpicker('refresh');
    $('#pointKT').selectpicker('val', 0);
    $('#pointKT').selectpicker('refresh');
    $('#pointAP').selectpicker('val', -1);
    $('#pointAP').selectpicker('refresh');

    $('#pointLC').selectpicker('val', 0);
    $('#pointLC').selectpicker('refresh');
    $('.pointAX').show();
    $('.pointDX').hide();
    ////高限
    $("#pointCKH4").prop("checked", false);
    $("#pointCKH3").prop("checked", false);
    $("#pointCKZH").prop("checked", false);
    $("#pointCKHL").prop("checked", false);
    //低限
    $("#pointCKLL").prop("checked", false);
    $("#pointCKZL").prop("checked", false);
    $("#pointCKL3").prop("checked", false);
    $("#pointCKL4").prop("checked", false);

    $('#pointH4').val('');
    $('#pointH3').val('');
    $('#pointZH').val('');
    $('#pointHL').val('');
    $('#pointLL').val('');
    $('#pointZL').val('');
    $('#pointL3').val('');
    $('#pointL4').val('');
}

function showCalcModal() {
    $('#calcFormulaModal').modal({
        backdrop: 'static'
    });
    $('#calcFormula').val($('#pointEX').val());
}

function addCalcFormual() {
    var calcFormula = $('#calcFormula').val();
    $('#pointEX').val(calcFormula);
    closeCalcFormualModal();
}

function closeCalcFormualModal() {
    $("#calcFormulaModal").modal('hide');
    $('#calcFormula').val('');
}

/**添加或更新点**/
function addProjectPoint() {
    var pointPN = $('#pointPN').val();
    if (!pointPN) {
        toastr.warning('点名不能为空');
        return;
    }
    var pattern = /^[A-Za-z0-9_\u4e00-\u9fa5]+$/;
    var result = pointPN.match(pattern);
    if (result == null || result.length != 1) {
        toastr.warning('点名只能是数字、字母和下划线');
        return;
    }
    var pointAN = $('#pointAN').val();
    var pointRT = $('#pointRT').selectpicker('val');
    var pointFQ = $('#pointFQ').val();
    var pointED = $('#pointED').val();
    var pointTV = $('#pointTV').val();
    var pointBV = $('#pointBV').val();
    var pointEU = $('#pointEU').val();
    var pointKZ = $('#pointKZ').val();
    var pointFM = $('#pointFM').val();

    var pointLC = '';
    if (pointRT == 1) {
        pointLC = $('#pointLC').selectpicker('val');
    } else {
        var LCH4 = $('#pointCKH4').is(':checked');
        if (LCH4) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCL4 = $('#pointCKL4').is(':checked');
        if (LCL4) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCH3 = $('#pointCKH3').is(':checked');
        if (LCH3) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCL3 = $('#pointCKL3').is(':checked');
        if (LCL3) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCZH = $('#pointCKZH').is(':checked');
        if (LCZH) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCZL = $('#pointCKZL').is(':checked');
        if (LCZL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCHL = $('#pointCKHL').is(':checked');
        if (LCHL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCLL = $('#pointCKLL').is(':checked');
        if (LCLL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        pointLC = parseInt(pointLC, 2);
    }
    var pointAP = $('#pointAP').selectpicker('val');
    var pointH4 = $('#pointH4').val();
    var pointH3 = $('#pointH3').val();
    var pointZH = $('#pointZH').val();
    var pointHL = $('#pointHL').val();
    var pointLL = $('#pointLL').val();
    var pointZL = $('#pointZL').val();
    var pointL3 = $('#pointL3').val();
    var pointL4 = $('#pointL4').val();
    var C1 = $('#C1').val().replace('#', '0x');
    var C2 = $('#C2').val().replace('#', '0x');
    var C3 = $('#C3').val().replace('#', '0x');
    var C4 = $('#C4').val().replace('#', '0x');
    var C5 = $('#C5').val().replace('#', '0x');
    var C6 = $('#C6').val().replace('#', '0x');
    var C7 = $('#C7').val().replace('#', '0x');
    var C8 = $('#C8').val().replace('#', '0x');
    var pointPT = $('#pointPT').selectpicker('val');
    var pointKT = $('#pointKT').selectpicker('val');
    var pointEX = $('#pointEX').val();
    var pointCT = $('#pointCT').val();
    var pointTM = $('#pointTM').val();

    $.ajax({
        type: 'POST',
        url: "/domain/mtree/addProjectPoint",
        dataType: "json",
        data: {
            mtreeId: mtreeId,
            pointPN: pointPN,
            pointAN: pointAN,
            pointRT: pointRT,
            pointFQ: pointFQ,
            pointED: pointED,
            pointTV: pointTV,
            pointBV: pointBV,
            pointEU: pointEU,
            pointKZ: pointKZ,
            pointFM: pointFM,
            pointAP: pointAP,
            pointH4: pointH4,
            pointH3: pointH3,
            pointZH: pointZH,
            pointHL: pointHL,
            pointLL: pointLL,
            pointZL: pointZL,
            pointL3: pointL3,
            pointL4: pointL4,
            pointLC: pointLC,
            C1: C1,
            C2: C2,
            C3: C3,
            C4: C4,
            C5: C5,
            C6: C6,
            C7: C7,
            C8: C8,
            pointPT: pointPT,
            pointKT: pointKT,
            pointEX: pointEX,
            pointCT: pointCT,
            pointTM: pointTM
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                toastr.success('操作成功');
                queryPointRefresh();
                closePointModal();
            }
        },
        error: function (data) {
            toastr.warning("操作失败！");
        }

    });

}
/*更新点信息*/
function updateProjectPoint() {
    var pointID = $('#pointID').val();
    var pointAN = $('#pointAN').val();
    var pointRT = $('#pointRT').selectpicker('val');
    var pointFQ = $('#pointFQ').val();
    var pointED = $('#pointED').val();
    var pointTV = $('#pointTV').val();
    var pointBV = $('#pointBV').val();
    var pointEU = $('#pointEU').val();
    var pointKZ = $('#pointKZ').val();
    var pointFM = $('#pointFM').val();
    var pointLC = '';
    if (pointRT == 1) {
        pointLC = $('#pointLC').selectpicker('val');
    } else {
        var LCH4 = $('#pointCKH4').is(':checked');
        if (LCH4) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCL4 = $('#pointCKL4').is(':checked');
        if (LCL4) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCH3 = $('#pointCKH3').is(':checked');
        if (LCH3) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCL3 = $('#pointCKL3').is(':checked');
        if (LCL3) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCZH = $('#pointCKZH').is(':checked');
        if (LCZH) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCZL = $('#pointCKZL').is(':checked');
        if (LCZL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCHL = $('#pointCKHL').is(':checked');
        if (LCHL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        var LCLL = $('#pointCKLL').is(':checked');
        if (LCLL) {
            pointLC += '1';
        } else {
            pointLC += '0';
        }
        pointLC = parseInt(pointLC, 2);
    }
    var pointAP = $('#pointAP').selectpicker('val');
    var pointH4 = $('#pointH4').val();
    var pointH3 = $('#pointH3').val();
    var pointZH = $('#pointZH').val();
    var pointHL = $('#pointHL').val();
    var pointLL = $('#pointLL').val();
    var pointZL = $('#pointZL').val();
    var pointL3 = $('#pointL3').val();
    var pointL4 = $('#pointL4').val();
    var C1 = $('#C1').val().replace('#', '0x');
    var C2 = $('#C2').val().replace('#', '0x');
    var C3 = $('#C3').val().replace('#', '0x');
    var C4 = $('#C4').val().replace('#', '0x');
    var C5 = $('#C5').val().replace('#', '0x');
    var C6 = $('#C6').val().replace('#', '0x');
    var C7 = $('#C7').val().replace('#', '0x');
    var C8 = $('#C8').val().replace('#', '0x');

    var pointPT = $('#pointPT').selectpicker('val');
    var pointKT = $('#pointKT').selectpicker('val');
    var pointEX = $('#pointEX').val();
    var pointCT = $('#pointCT').val();
    var pointTM = $('#pointTM').val();

    $.ajax({
        type: 'POST',
        url: "/domain/mtree/updateProjectPoint",
        dataType: "json",
        data: {
            UUID: pointUUID,
            pointID: pointID,
            pointAN: pointAN,
            pointRT: pointRT,
            pointFQ: pointFQ,
            pointED: pointED,
            pointTV: pointTV,
            pointBV: pointBV,
            pointEU: pointEU,
            pointKZ: pointKZ,
            pointFM: pointFM,
            pointAP: pointAP,
            pointH4: pointH4,
            pointH3: pointH3,
            pointZH: pointZH,
            pointHL: pointHL,
            pointLL: pointLL,
            pointZL: pointZL,
            pointL3: pointL3,
            pointL4: pointL4,
            pointLC: pointLC,
            C1: C1,
            C2: C2,
            C3: C3,
            C4: C4,
            C5: C5,
            C6: C6,
            C7: C7,
            C8: C8,
            pointPT: pointPT,
            pointKT: pointKT,
            pointEX: pointEX,
            pointCT: pointCT,
            pointTM: pointTM
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                toastr.success('操作成功');
                queryPointRefresh();
                closePointModal();
            }
        },
        error: function (data) {
            toastr.warning("操作失败！");
        }
    });
}

//点组添加
function addPointGroupModal() {
    // 弹出添加框
    $('#addPointGroupModal').modal({
        backdrop: 'static'
    });
}
//关闭点组框
function closeAddPointGroupModal() {
    $('#addPointGroupModal').modal('hide');
    $('#addPointGroupName').val('');
    $('#addPointGroupDesc').val('');
}
//添加点组
function addPointGroup() {
    var pointGroupName = $('#addPointGroupName').val();
    if (!pointGroupName) {
        toastr.warning('点组名称不能为空');
        return;
    }
    var pointGroupDesc = $('#addPointGroupDesc').val();
    $.ajax({
        type: 'post',
        url: '/dataview/historySnapSta/addPointGroup',
        data: {
            groupName: pointGroupName,
            description: pointGroupDesc
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                toastr.success('添加点组成功');
                closeAddPointGroupModal();
                getPointGroupList();
            }
        },
        error: function () {
            toastr.error('添加点组失败');
        }
    });
}