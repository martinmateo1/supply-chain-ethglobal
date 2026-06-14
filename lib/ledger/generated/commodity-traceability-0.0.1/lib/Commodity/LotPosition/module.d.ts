// Generated from ../../Commodity/LotPosition/module.daml

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 from '@daml.js/daml-prim-DA-Types-1.0.0';
import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

import * as Commodity_Types from '../../Commodity/Types/module';

export declare type AcceptTransfer = {
}

export declare const AcceptTransfer:
  damlTypes.Serializable<AcceptTransfer>

export declare type CombineLots = {
  otherLotCid: damlTypes.ContractId<LotPosition>,
  combinedLotId: string,
}

export declare const CombineLots:
  damlTypes.Serializable<CombineLots>

export declare type CustodyTransfer = {
  transferId: string,
  sender: damlTypes.Party,
  receiver: damlTypes.Party,
  commodity: Commodity_Types.CommodityKind,
  quantity: Commodity_Types.Quantity,
  certifications: Commodity_Types.Certification[],
  quality: Commodity_Types.QualityGrade,
  originIdentifier: damlTypes.Optional<string>,
  sourceLotId: string,
  evidenceHashes: string[],
  status: TransferStatus,
}

export declare interface CustodyTransferInterface {
  AcceptTransfer: 
    damlTypes.Choice<CustodyTransfer, AcceptTransfer, damlTypes.ContractId<LotPosition>, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<CustodyTransfer, undefined>>;
  Archive: 
    damlTypes.Choice<CustodyTransfer, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<CustodyTransfer, undefined>>;
  RejectTransfer: 
    damlTypes.Choice<CustodyTransfer, RejectTransfer, damlTypes.ContractId<LotPosition>, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<CustodyTransfer, undefined>>;
}
export declare const CustodyTransfer:
  damlTypes.Template<CustodyTransfer, undefined, '#commodity-traceability:Commodity.LotPosition:CustodyTransfer'> &
  damlTypes.ToInterface<CustodyTransfer, never> &
  CustodyTransferInterface

export declare type InitiateTransfer = {
  receiver: damlTypes.Party,
  transferId: string,
  transferAmount: damlTypes.Numeric,
  evidenceHashes: string[],
}

export declare const InitiateTransfer:
  damlTypes.Serializable<InitiateTransfer>

export declare type LotPosition = {
  owner: damlTypes.Party,
  lotId: string,
  commodity: Commodity_Types.CommodityKind,
  quantity: Commodity_Types.Quantity,
  certifications: Commodity_Types.Certification[],
  quality: Commodity_Types.QualityGrade,
  originIdentifier: damlTypes.Optional<string>,
}

export declare interface LotPositionInterface {
  Archive: 
    damlTypes.Choice<LotPosition, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<LotPosition, undefined>>;
  CombineLots: 
    damlTypes.Choice<LotPosition, CombineLots, damlTypes.ContractId<LotPosition>, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<LotPosition, undefined>>;
  InitiateTransfer: 
    damlTypes.Choice<LotPosition, InitiateTransfer, pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2<damlTypes.ContractId<CustodyTransfer>, damlTypes.Optional<damlTypes.ContractId<LotPosition>>>, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<LotPosition, undefined>>;
}
export declare const LotPosition:
  damlTypes.Template<LotPosition, undefined, '#commodity-traceability:Commodity.LotPosition:LotPosition'> &
  damlTypes.ToInterface<LotPosition, never> &
  LotPositionInterface

export declare type RejectTransfer = {
}

export declare const RejectTransfer:
  damlTypes.Serializable<RejectTransfer>

export declare type TransferStatus =
  | 'Pending'
  | 'Completed'
  | 'Rejected'


export declare const TransferStatus:
  damlTypes.Serializable<TransferStatus> & { readonly keys: TransferStatus[] } & { readonly [e in TransferStatus]: e }
