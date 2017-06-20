/*
*  op_service.h
*  Copyright (C) 2015 Magus Technology Co.,Ltd.

   Change history:
   1.0  2015-03-05  First version

*/
#ifndef _OP_SERVICE_H
#define _OP_SERVICE_H

#include "op_type.h"

#ifndef GMacroAPI
	#if defined(__WIN32) || defined(__WIN32__) || defined(WIN32)
        #ifdef MAGUS_IMPLETMENT_SHARED
            #define GMacroAPI(type) __declspec(dllexport) type _stdcall
        #elif defined MAGUS_IMPLETMENT_STATIC || defined MAGUS_USE_STATIC
            #define GMacroAPI(type) type
        #else
            #define GMacroAPI(type) __declspec(dllimport) type _stdcall
        #endif
    #else
        #define GMacroAPI(type) type
    #endif
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef void* op_table;
typedef void* op_request;
typedef void* op_response;
typedef void* op_stream;
typedef void* op_row;

// create, free
GMacroAPI(op_table) op2_new_table(const char *name);
GMacroAPI(op_table) op2_copy_table(op_table table);
GMacroAPI(void) op2_clear_table(op_table table);
GMacroAPI(void) op2_free_table(op_table table);

// column
GMacroAPI(int) op2_add_column(op_table table, const char *name, int type, int length, int mask, char *defval, char *expr);
GMacroAPI(int) op2_column_count(op_table table);
GMacroAPI(int) op2_column_type(op_table table, int col);
GMacroAPI(const char*) op2_column_name(op_table table, int col);

// row
GMacroAPI(size_t) op2_row_count(op_table table);
GMacroAPI(int) op2_append_row(op_table table);
GMacroAPI(int) op2_rollback(op_table table);
GMacroAPI(int) op2_set_rowid(op_table table, size_t rowid);
GMacroAPI(op_row) op2_new_row(op_table table);
GMacroAPI(int) op2_append(op_table table, op_row row);

// getter
GMacroAPI(int) op2_column_null(op_row row, int col);
GMacroAPI(int) op2_column_bytes(op_row row, int col);
GMacroAPI(int64_t) op2_column_int(op_row row, int col);
GMacroAPI(double) op2_column_double(op_row row, int col);

// For table, don't free return value.
// For row, free value after use.
GMacroAPI(const char*) op2_column_string(op_row row, int col);
GMacroAPI(const void*) op2_column_binary(op_row row, int col);
GMacroAPI(const op_value*) op2_column_value(op_row row, int col);
GMacroAPI(void) op2_free_value(op_value *value);

// setter
GMacroAPI(void) op2_bind_bool(op_row row, int col, int value);
GMacroAPI(void) op2_bind_int8(op_row row, int col, int value, int64_t mask=-1);
GMacroAPI(void) op2_bind_int16(op_row row, int col, int value, int64_t mask=-1);
GMacroAPI(void) op2_bind_int32(op_row row, int col, int value, int64_t mask=-1);
GMacroAPI(void) op2_bind_int(op_row row, int col, int64_t value, int64_t mask=-1);
GMacroAPI(void) op2_bind_float(op_row row, int col, float value);
GMacroAPI(void) op2_bind_double(op_row row, int col, double value);
GMacroAPI(void) op2_bind_string(op_row row, int col, const char *value);
GMacroAPI(void) op2_bind_binary(op_row row, int col, const void *value, int len);
GMacroAPI(void) op2_bind_value(op_row row, int col, const op_value *value);

// request
GMacroAPI(op_request) op2_new_request();
GMacroAPI(void) op2_free_request(op_request r);

// table
GMacroAPI(void) op2_set_table(void* r, op_table t);
GMacroAPI(op_table) op2_get_table(void* r);

// option
GMacroAPI(void) op2_set_option(void* r, const char *key, const char *value);
GMacroAPI(void) op2_set_option_int(void* r, const char *key, int value);
GMacroAPI(void) op2_set_option_value(void* r, const char *key, const op_value *v);
GMacroAPI(const char*) op2_get_option(void* r, const char *key, char *buffer, int len);
GMacroAPI(const op_value*) op2_get_option_value(void* r, const char *key);
GMacroAPI(const char*) op2_get_error(void* r);
GMacroAPI(int) op2_get_errno(void* r);

// filter
GMacroAPI(void) op2_add_filter(op_request req, const char *l, int op, const char *r, int rel);
GMacroAPI(void) op2_add_filter_t(op_request r, const filter_t *filter);
GMacroAPI(void) op2_clear_filter(op_request r);
GMacroAPI(int) op2_get_filter_count(op_request r);
GMacroAPI(const filter_t*) op2_get_filter(op_request r, int i);

// indices
GMacroAPI(void) op2_set_indices(op_request r, const char *name, int count, const int64_t *keys);
GMacroAPI(void) op2_set_indices_string(op_request r, const char *name, int count, const char **keys);
GMacroAPI(int) op2_get_indices(op_request r, int64_t **intKeys, char ***strKeys);

// request
GMacroAPI(int) op2_get_request(op_stream opio, op_request *r);
GMacroAPI(int) op2_write_request(op_stream opio, op_request r);

// response
GMacroAPI(int) op2_get_response(op_stream opio, op_response *r);
GMacroAPI(int) op2_write_response(op_stream opio, op_response r);
GMacroAPI(void) op2_free_response(op_response r);

// content
GMacroAPI(int) op2_write_content(op_stream opio, op_table t);
GMacroAPI(int) op2_flush_content(op_stream opio);
GMacroAPI(int) op2_next_content(op_stream opio, op_table result, int clear, int *eof);

// io stream
GMacroAPI(op_stream) op2_get_stream(void *openplant);
GMacroAPI(void) op2_set_compress(op_stream opio, int zip);

// flush io
GMacroAPI(int) op2_flush(op_stream opio);

// exec
GMacroAPI(int) op2_exec(const char *command, op_table *result);

// uuid
GMacroAPI(int64_t) op2_make_uuid(const char *key);


#ifdef __cplusplus
}
#endif

#endif /* _OP_SERVICE_H */

