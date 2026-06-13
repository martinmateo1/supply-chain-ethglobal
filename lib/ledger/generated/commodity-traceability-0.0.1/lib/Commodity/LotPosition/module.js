"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });

/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');

var pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 = require('@daml.js/daml-prim-DA-Types-1.0.0');
var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');

var Commodity_Types = require('../../Commodity/Types/module');

exports.AcceptTransfer = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.object({
    });
  }),
  encode: function (__typed__) {
    return {};
  },
};

exports.CustodyTransfer = damlTypes.assembleTemplate(
  {
    templateId: '#commodity-traceability:Commodity.LotPosition:CustodyTransfer',
    templateIdWithPackageId: '#e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35:Commodity.LotPosition:CustodyTransfer',
    keyDecoder: jtv.constant(undefined),
    keyEncode: function () { throw 'EncodeError'; },
    decoder: damlTypes.lazyMemo(function () {
      return jtv.object({
        transferId: damlTypes.Text.decoder,
        sender: damlTypes.Party.decoder,
        receiver: damlTypes.Party.decoder,
        commodity: Commodity_Types.CommodityKind.decoder,
        quantity: Commodity_Types.Quantity.decoder,
        certifications: damlTypes.List(Commodity_Types.Certification).decoder,
        quality: Commodity_Types.QualityGrade.decoder,
        originIdentifier: jtv.Decoder.withDefault(null, damlTypes.Optional(damlTypes.Text).decoder),
        sourceLotId: damlTypes.Text.decoder,
        evidenceHashes: damlTypes.List(damlTypes.Text).decoder,
        status: exports.TransferStatus.decoder,
      });
    }),
    encode: function (__typed__) {
      return {
        transferId: damlTypes.Text.encode(__typed__.transferId),
        sender: damlTypes.Party.encode(__typed__.sender),
        receiver: damlTypes.Party.encode(__typed__.receiver),
        commodity: Commodity_Types.CommodityKind.encode(__typed__.commodity),
        quantity: Commodity_Types.Quantity.encode(__typed__.quantity),
        certifications: damlTypes.List(Commodity_Types.Certification).encode(__typed__.certifications),
        quality: Commodity_Types.QualityGrade.encode(__typed__.quality),
        originIdentifier: damlTypes.Optional(damlTypes.Text).encode(__typed__.originIdentifier),
        sourceLotId: damlTypes.Text.encode(__typed__.sourceLotId),
        evidenceHashes: damlTypes.List(damlTypes.Text).encode(__typed__.evidenceHashes),
        status: exports.TransferStatus.encode(__typed__.status),
      };
    },
    AcceptTransfer: {
      template: function () { return exports.CustodyTransfer; },
      choiceName: 'AcceptTransfer',
      argumentDecoder: damlTypes.lazyMemo(function () {
        return exports.AcceptTransfer.decoder;
      }),
      argumentEncode: function (__typed__) { return exports.AcceptTransfer.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () {
        return damlTypes.ContractId(exports.LotPosition).decoder;
      }),
      resultEncode: function (__typed__) { return damlTypes.ContractId(exports.LotPosition).encode(__typed__); },
    },
    Archive: {
      template: function () { return exports.CustodyTransfer; },
      choiceName: 'Archive',
      argumentDecoder: damlTypes.lazyMemo(function () {
        return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder;
      }),
      argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () {
        return damlTypes.Unit.decoder;
      }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
    RejectTransfer: {
      template: function () { return exports.CustodyTransfer; },
      choiceName: 'RejectTransfer',
      argumentDecoder: damlTypes.lazyMemo(function () {
        return exports.RejectTransfer.decoder;
      }),
      argumentEncode: function (__typed__) { return exports.RejectTransfer.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () {
        return damlTypes.ContractId(exports.LotPosition).decoder;
      }),
      resultEncode: function (__typed__) { return damlTypes.ContractId(exports.LotPosition).encode(__typed__); },
    },
  },
);

damlTypes.registerTemplate(exports.CustodyTransfer, ['e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35', '#commodity-traceability']);

exports.InitiateTransfer = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.object({
      receiver: damlTypes.Party.decoder,
      transferId: damlTypes.Text.decoder,
      transferAmount: damlTypes.Numeric(10).decoder,
      evidenceHashes: damlTypes.List(damlTypes.Text).decoder,
    });
  }),
  encode: function (__typed__) {
    return {
      receiver: damlTypes.Party.encode(__typed__.receiver),
      transferId: damlTypes.Text.encode(__typed__.transferId),
      transferAmount: damlTypes.Numeric(10).encode(__typed__.transferAmount),
      evidenceHashes: damlTypes.List(damlTypes.Text).encode(__typed__.evidenceHashes),
    };
  },
};

exports.LotPosition = damlTypes.assembleTemplate(
  {
    templateId: '#commodity-traceability:Commodity.LotPosition:LotPosition',
    templateIdWithPackageId: '#e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35:Commodity.LotPosition:LotPosition',
    keyDecoder: jtv.constant(undefined),
    keyEncode: function () { throw 'EncodeError'; },
    decoder: damlTypes.lazyMemo(function () {
      return jtv.object({
        owner: damlTypes.Party.decoder,
        lotId: damlTypes.Text.decoder,
        commodity: Commodity_Types.CommodityKind.decoder,
        quantity: Commodity_Types.Quantity.decoder,
        certifications: damlTypes.List(Commodity_Types.Certification).decoder,
        quality: Commodity_Types.QualityGrade.decoder,
        originIdentifier: jtv.Decoder.withDefault(null, damlTypes.Optional(damlTypes.Text).decoder),
      });
    }),
    encode: function (__typed__) {
      return {
        owner: damlTypes.Party.encode(__typed__.owner),
        lotId: damlTypes.Text.encode(__typed__.lotId),
        commodity: Commodity_Types.CommodityKind.encode(__typed__.commodity),
        quantity: Commodity_Types.Quantity.encode(__typed__.quantity),
        certifications: damlTypes.List(Commodity_Types.Certification).encode(__typed__.certifications),
        quality: Commodity_Types.QualityGrade.encode(__typed__.quality),
        originIdentifier: damlTypes.Optional(damlTypes.Text).encode(__typed__.originIdentifier),
      };
    },
    Archive: {
      template: function () { return exports.LotPosition; },
      choiceName: 'Archive',
      argumentDecoder: damlTypes.lazyMemo(function () {
        return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder;
      }),
      argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () {
        return damlTypes.Unit.decoder;
      }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
    InitiateTransfer: {
      template: function () { return exports.LotPosition; },
      choiceName: 'InitiateTransfer',
      argumentDecoder: damlTypes.lazyMemo(function () {
        return exports.InitiateTransfer.decoder;
      }),
      argumentEncode: function (__typed__) { return exports.InitiateTransfer.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () {
        return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(exports.CustodyTransfer), damlTypes.Optional(damlTypes.ContractId(exports.LotPosition))).decoder;
      }),
      resultEncode: function (__typed__) { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(exports.CustodyTransfer), damlTypes.Optional(damlTypes.ContractId(exports.LotPosition))).encode(__typed__); },
    },
  },
);

damlTypes.registerTemplate(exports.LotPosition, ['e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35', '#commodity-traceability']);

exports.RejectTransfer = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.object({
    });
  }),
  encode: function (__typed__) {
    return {};
  },
};

exports.TransferStatus = {
  Pending: 'Pending',
  Completed: 'Completed',
  Rejected: 'Rejected',
  keys: ['Pending', 'Completed', 'Rejected'],
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.constant(exports.TransferStatus.Pending),
      jtv.constant(exports.TransferStatus.Completed),
      jtv.constant(exports.TransferStatus.Rejected),
    );
  }),
  encode: function (__typed__) { return __typed__; },
};
