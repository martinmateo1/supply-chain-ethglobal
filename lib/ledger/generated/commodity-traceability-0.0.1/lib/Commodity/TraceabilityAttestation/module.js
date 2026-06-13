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

exports.TraceabilityAttestation = damlTypes.assembleTemplate(
  {
    templateId: '#commodity-traceability:Commodity.TraceabilityAttestation:TraceabilityAttestation',
    templateIdWithPackageId: '#e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35:Commodity.TraceabilityAttestation:TraceabilityAttestation',
    keyDecoder: jtv.constant(undefined),
    keyEncode: function () { throw 'EncodeError'; },
    decoder: damlTypes.lazyMemo(function () {
      return jtv.object({
        issuer: damlTypes.Party.decoder,
        attestationPayloadHash: damlTypes.Text.decoder,
        coveredLotIds: damlTypes.List(damlTypes.Text).decoder,
      });
    }),
    encode: function (__typed__) {
      return {
        issuer: damlTypes.Party.encode(__typed__.issuer),
        attestationPayloadHash: damlTypes.Text.encode(__typed__.attestationPayloadHash),
        coveredLotIds: damlTypes.List(damlTypes.Text).encode(__typed__.coveredLotIds),
      };
    },
    Archive: {
      template: function () { return exports.TraceabilityAttestation; },
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

damlTypes.registerTemplate(exports.TraceabilityAttestation, ['e57d1471a423cadc170e033b7c6aea16661dfd0c9e9670c43e0cd714eacd8a35', '#commodity-traceability']);
