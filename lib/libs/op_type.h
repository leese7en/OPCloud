/*
*  op_type.h
*  Copyright (C) 2015 Magus Technology Co.,Ltd.

   Change history:
   1.0  2015-03-05  First version

*/
#ifndef _OP_TYPE_H
#define _OP_TYPE_H

#ifdef _WIN32
typedef signed char int8_t;
typedef unsigned char uint8_t;
typedef short int16_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef unsigned int uint32_t;
typedef __int64 int64_t;
typedef unsigned __int64 uint64_t;
#else
#include <inttypes.h>
#endif

#ifdef _MSC_VER
#pragma warning(disable:4786) // long identifier name in STL
#endif

// 数据类型
#define vtArrayMask 16
typedef enum {
    vtNull=0,
    vtBool=1,
    vtInt8=2,
    vtInt16=3,
    vtInt32=4,
    vtInt64=5,
    vtFloat=6,
    vtDouble=7,
    vtDateTime=8,
    vtString=9,
    vtBinary=10,
    vtObject=11,
    vtArray=12,
    vtMap=13,
    vtBoolArray=vtBool+vtArrayMask,
    vtInt8Array=vtInt8+vtArrayMask,
    vtInt16Array=vtInt16+vtArrayMask,
    vtInt32Array=vtInt32+vtArrayMask,
    vtInt64Array=vtInt64+vtArrayMask,
    vtFloatArray=vtFloat+vtArrayMask,
    vtDoubleArray=vtDouble+vtArrayMask,
    vtDateTimeArray=vtDateTime+vtArrayMask,
    vtStringArray=vtString+vtArrayMask,
    vtBinaryArray=vtBinary+vtArrayMask,
    vtObjectArray=vtObject+vtArrayMask,
    vtRow=32
} op_type;

// 数据结构体
#define OP_FLAG_GC  1
typedef struct {
    uint8_t type;
    uint8_t ext;            // 扩展类型
    uint8_t flag;           // 内存分配标记
    uint8_t reserved;       // 保留
    uint32_t length;        // null terminal is not included for string
    union {
        int64_t  i64;       // integer
        double   dec;       // decimal
        char*    raw;       // string, binary, object
    };
} op_value;

// 比较操作符: {=, !=, >, <, >=, <=, in, not in, like, not like, regexp}
typedef enum {
    operEQ=0,
    operNE=1,
    operGT=2,
    operLT=3,
    operGE=4,
    operLE=5,
    operIn=6,
    operNotIn=7,
    operLike=8,
    operNotLike=9,
    operReqexp=10
} oper_t;

// 逻辑操作符: {and, or}
typedef enum {
    relationAnd,
    relationOr
} relation_t;

// 过滤条件
typedef struct  {
    char *left;
    char *right;
    char oper;
    char relation;
} filter_t;


#endif /* _OP_TYPE_H */






















