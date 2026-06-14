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

var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');

var Commodity_Types = require('../../Commodity/Types/module');

exports.ConsumptionState = {
  Available: 'Available',
  Consumed: 'Consumed',
  keys: ['Available', 'Consumed'],
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.constant(exports.ConsumptionState.Available),
      jtv.constant(exports.ConsumptionState.Consumed),
    );
  }),
  encode: function (__typed__) { return __typed__; },
};

exports.SourceAssetReference = damlTypes.assembleTemplate(
  {
    templateId: '#commodity-traceability:Commodity.SourceAssetReference:SourceAssetReference',
    templateIdWithPackageId: '#f436614e76f9eae1bd3e287af6eeacf7c45bb5f4565e9dd1bb3a93b76568c582:Commodity.SourceAssetReference:SourceAssetReference',
    keyDecoder: jtv.constant(undefined),
    keyEncode: function () { throw 'EncodeError'; },
    decoder: damlTypes.lazyMemo(function () {
      return jtv.object({
        owner: damlTypes.Party.decoder,
        sourceLotId: damlTypes.Text.decoder,
        quantity: Commodity_Types.Quantity.decoder,
        state: exports.ConsumptionState.decoder,
      });
    }),
    encode: function (__typed__) {
      return {
        owner: damlTypes.Party.encode(__typed__.owner),
        sourceLotId: damlTypes.Text.encode(__typed__.sourceLotId),
        quantity: Commodity_Types.Quantity.encode(__typed__.quantity),
        state: exports.ConsumptionState.encode(__typed__.state),
      };
    },
    Archive: {
      template: function () { return exports.SourceAssetReference; },
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
  },
);

damlTypes.registerTemplate(exports.SourceAssetReference, ['f436614e76f9eae1bd3e287af6eeacf7c45bb5f4565e9dd1bb3a93b76568c582', '#commodity-traceability']);
