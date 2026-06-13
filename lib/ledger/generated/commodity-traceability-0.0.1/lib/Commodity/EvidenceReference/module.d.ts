// Generated from ../../Commodity/EvidenceReference/module.daml

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

export declare type EvidenceReference = {
  custodian: damlTypes.Party,
  transferId: string,
  documentHash: string,
  contentId: damlTypes.Optional<string>,
}

export declare interface EvidenceReferenceInterface {
  Archive: 
    damlTypes.Choice<EvidenceReference, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> &
    damlTypes.ChoiceFrom<damlTypes.Template<EvidenceReference, undefined>>;
}
export declare const EvidenceReference:
  damlTypes.Template<EvidenceReference, undefined, '#commodity-traceability:Commodity.EvidenceReference:EvidenceReference'> &
  damlTypes.ToInterface<EvidenceReference, never> &
  EvidenceReferenceInterface
