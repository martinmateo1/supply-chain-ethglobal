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

exports.EvidenceReference = damlTypes.assembleTemplate(
  {
    templateId: '#commodity-traceability:Commodity.EvidenceReference:EvidenceReference',
    templateIdWithPackageId: '#b8a4d450d2bfc6083baee7c4b059e8ad17ba996f8219d1d0aa114074e0b63294:Commodity.EvidenceReference:EvidenceReference',
    keyDecoder: jtv.constant(undefined),
    keyEncode: function () { throw 'EncodeError'; },
    decoder: damlTypes.lazyMemo(function () {
      return jtv.object({
        custodian: damlTypes.Party.decoder,
        transferId: damlTypes.Text.decoder,
        documentHash: damlTypes.Text.decoder,
        contentId: jtv.Decoder.withDefault(null, damlTypes.Optional(damlTypes.Text).decoder),
      });
    }),
    encode: function (__typed__) {
      return {
        custodian: damlTypes.Party.encode(__typed__.custodian),
        transferId: damlTypes.Text.encode(__typed__.transferId),
        documentHash: damlTypes.Text.encode(__typed__.documentHash),
        contentId: damlTypes.Optional(damlTypes.Text).encode(__typed__.contentId),
      };
    },
    Archive: {
      template: function () { return exports.EvidenceReference; },
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

damlTypes.registerTemplate(exports.EvidenceReference, ['b8a4d450d2bfc6083baee7c4b059e8ad17ba996f8219d1d0aa114074e0b63294', '#commodity-traceability']);
