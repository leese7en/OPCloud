/*
*  oplicense.h
*  Copyright (C) 2004-2014 Magus Technology Co.,Ltd.

   Change history:
   1.0  2014  First version

*/
#ifndef __OP_LICENSE_H
#define __OP_LICENSE_H


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


// ��Ȩ����
#define LM_NONE     0
#define LM_FILE     1
#define LM_UKEY   	2
#define LM_ANY     -1


/**
* @brief ��Ȩ�������
*/
#ifndef OPLM
typedef void* OPLM;
#endif


/**
* @brief ��Ʒ��Ȩ
*/
#ifndef OPLicense
typedef void* OPLicense;
#endif


/**
 * @brief ��ȡ��Ȩ����
 * @param type 	��Ȩ�豸�����Դ��LM_FILE-ϵͳ�Զ����ɣ�LM_UKEY-�ⲿUSBӲ������LM_ALL-��˳���Զ�����
 * @param path 	��Ȩ�����·��
 * @param cert 	��Ȩ֤���·�������Ϊ�գ�ȱʡΪ��Ȩ�ļ����Ӻ�׺.cer
 * @param error ���صĴ�����
 *
 * @return ��Ȩ����������Ҫ����lm_close()�ͷš�
*/
GMacroAPI(OPLM) op2_lm_open(int type, const char *path, const char *cert, int *error);


/**
 * @brief �ر���Ȩ����
*/
GMacroAPI(void) op2_lm_close(OPLM lm);


/**
 * @brief ��Ȩ���������
*/
GMacroAPI(int) op2_lm_get_type(OPLM lm);


/**
 * @brief ��Ȩ����ʱ��
*/
GMacroAPI(void) op2_lm_get_issue_date(OPLM lm, char *buf, int len);


/**
 * @brief ��ȡ�豸��
 * @param type 	�豸�����Դ��LM_FILE-ϵͳ�Զ����ɣ�LM_UKEY-�ⲿUSBӲ����
 * @param uid 	�ַ����飬��������豸���ֵ
 * @param len 	�ַ�������õ���󳤶�
 *
 * @return �ɹ�:0; ʧ��:������
*/
GMacroAPI(int) op2_lm_get_uid(int type, char *uid, int len);


/**
 * @brief ��ȡ������Ŀ����Ʒ���豸����Ȩ
 * @param lm 		��Ȩ����
 * @param project 	��Ȩ��Ŀ�����Ϊ�գ�ȱʡΪ��һ����Ŀ
 * @param product 	��Ȩ��Ʒ
 * @param host 		��Ȩ�豸ID
 *
 * @return ��Ʒ��Ȩ, ������Ҫ����lm_free_license()�ͷ�
*/
GMacroAPI(OPLicense) op2_lm_get_license(OPLM lm, const char *project, const char *product, const char *uid);


/**
 * @brief �ͷ���Ȩ
*/
GMacroAPI(void) op2_lm_free_license(OPLicense lic);


/**
 * @brief ��ȡ��Ȩ������ֵ
 * @param lic 	��Ʒ��Ȩ
 * @param key 	��Ȩ����
 * @param uid 	�ַ����飬���������Ȩ���Ե�ֵ
 * @param len 	�ַ�������õ���󳤶�
 *
 * @return �����룺0-�ɹ���-1-����δ�ҵ�
*/
GMacroAPI(int) op2_lm_get_license_value(OPLicense lic, const char *key, char *buf, int len);


/**
 * @brief ������Ȩ��¼��
*/
GMacroAPI(int) op2_lm_get_count(OPLM lm);


/**
 * @brief ���ص�������Ӧ����Ȩ
 * @param lm 		��Ȩ����
 * @param index 	��Ȩ����
 *
 * @return ��Ʒ��Ȩ, ������Ҫ����lm_free_license()�ͷ�
*/
GMacroAPI(OPLicense) op2_lm_get_at(OPLM lm, int index);


#ifdef __cplusplus
}
#endif

#endif // __OP_LICENSE_H

