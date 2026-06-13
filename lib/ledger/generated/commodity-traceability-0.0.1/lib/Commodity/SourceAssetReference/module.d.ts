// Generated from ../../Commodity/SourceAssetReference/module.daml

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

import * as Commodity_Types from '../../Commodity/Types/module';

export declare type ConsumptionState =
  | 'Available'
  | 'Consumed'


export declare const ConsumptionState:
  damlTypes.Serializable<ConsumptionState> & { readonly keys: ConsumptionState[] } & { readonly [e in ConsumptionState]: e }

export declare type SourceAssetReference = {
  owner: damlTypes.Party,
  sourceLotId: string,
  quantity: Commodity_Types.Quantity,
  state: ConsumptionState,
}

export declare interface SourceAssetReferenceInterface {
  Archive: 
    damlTypes.Choice<SourceAssetReference, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<SourceAssetReference, undefined>>;
}
export declare const SourceAssetReference:
  damlTypes.Template<SourceAssetReference, undefined, '#commodity-traceability:Commodity.SourceAssetReference:SourceAssetReference'> &
  damlTypes.ToInterface<SourceAssetReference, never> &
  SourceAssetReferenceInterface
