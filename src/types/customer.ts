/**
 * 顧客管理関連の型定義
 */

import { ContactInfo, BaseSearchCriteria } from './common.js';

/**
 * 顧客タイプ
 */
export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE',
}

/**
 * 顧客情報
 */
export interface Customer {
  customerId: string;
  name: string;
  phoneticName: string;
  customerType: CustomerType;
  contactInfo: ContactInfo;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

/**
 * 顧客データ（作成・更新用）
 */
export interface CustomerData {
  name: string;
  phoneticName: string;
  customerType: CustomerType;
  contactInfo: ContactInfo;
}

/**
 * 顧客検索条件
 */
export interface CustomerSearchCriteria extends BaseSearchCriteria {
  customerId?: string;
  name?: string;
  phoneticName?: string;
  customerType?: CustomerType;
}
