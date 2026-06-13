// Generated from ../../Commodity/Types/module.daml

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

export declare type Certification =
  | 'NonGMO'
  | 'DeforestationFree'


export declare const Certification:
  damlTypes.Serializable<Certification> & { readonly keys: Certification[] } & { readonly [e in Certification]: e }

export declare type CommodityKind =
  | 'Coffee'
  | 'Cacao'


export declare const CommodityKind:
  damlTypes.Serializable<CommodityKind> & { readonly keys: CommodityKind[] } & { readonly [e in CommodityKind]: e }

export declare type CompanyId =
  | { tag: 'CompanyId'; value: string }


export declare const CompanyId:
  damlTypes.Serializable<CompanyId>

export declare type OperationalNodeId =
  | { tag: 'OperationalNodeId'; value: string }


export declare const OperationalNodeId:
  damlTypes.Serializable<OperationalNodeId>

export declare type PartyViewId =
  | { tag: 'PartyViewId'; value: string }


export declare const PartyViewId:
  damlTypes.Serializable<PartyViewId>

export declare type QualityGrade =
  | 'GradeA'
  | 'GradeB'
  | 'GradeC'


export declare const QualityGrade:
  damlTypes.Serializable<QualityGrade> & { readonly keys: QualityGrade[] } & { readonly [e in QualityGrade]: e }

export declare type Quantity = {
  amount: damlTypes.Numeric,
  unit: string,
}

export declare const Quantity:
  damlTypes.Serializable<Quantity>
