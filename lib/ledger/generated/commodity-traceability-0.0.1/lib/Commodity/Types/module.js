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

exports.Certification = {
  NonGMO: 'NonGMO',
  DeforestationFree: 'DeforestationFree',
  keys: ['NonGMO', 'DeforestationFree'],
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.constant(exports.Certification.NonGMO),
      jtv.constant(exports.Certification.DeforestationFree),
    );
  }),
  encode: function (__typed__) { return __typed__; },
};

exports.CommodityKind = {
  Coffee: 'Coffee',
  Cacao: 'Cacao',
  keys: ['Coffee', 'Cacao'],
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.constant(exports.CommodityKind.Coffee),
      jtv.constant(exports.CommodityKind.Cacao),
    );
  }),
  encode: function (__typed__) { return __typed__; },
};

exports.CompanyId = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.object({
        tag: jtv.constant("CompanyId"),
        value: damlTypes.Text.decoder,
      }),
    );
  }),
  encode: function (__typed__) {
    switch(__typed__.tag) {
      case 'CompanyId': return {tag: __typed__.tag, value: damlTypes.Text.encode(__typed__.value)};
      default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type CompanyId';
    }
  },
};

exports.OperationalNodeId = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.object({
        tag: jtv.constant("OperationalNodeId"),
        value: damlTypes.Text.decoder,
      }),
    );
  }),
  encode: function (__typed__) {
    switch(__typed__.tag) {
      case 'OperationalNodeId': return {tag: __typed__.tag, value: damlTypes.Text.encode(__typed__.value)};
      default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type OperationalNodeId';
    }
  },
};

exports.PartyViewId = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.object({
        tag: jtv.constant("PartyViewId"),
        value: damlTypes.Text.decoder,
      }),
    );
  }),
  encode: function (__typed__) {
    switch(__typed__.tag) {
      case 'PartyViewId': return {tag: __typed__.tag, value: damlTypes.Text.encode(__typed__.value)};
      default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type PartyViewId';
    }
  },
};

exports.QualityGrade = {
  GradeA: 'GradeA',
  GradeB: 'GradeB',
  GradeC: 'GradeC',
  keys: ['GradeA', 'GradeB', 'GradeC'],
  decoder: damlTypes.lazyMemo(function () {
    return jtv.oneOf(
      jtv.constant(exports.QualityGrade.GradeA),
      jtv.constant(exports.QualityGrade.GradeB),
      jtv.constant(exports.QualityGrade.GradeC),
    );
  }),
  encode: function (__typed__) { return __typed__; },
};

exports.Quantity = {
  decoder: damlTypes.lazyMemo(function () {
    return jtv.object({
      amount: damlTypes.Numeric(10).decoder,
      unit: damlTypes.Text.decoder,
    });
  }),
  encode: function (__typed__) {
    return {
      amount: damlTypes.Numeric(10).encode(__typed__.amount),
      unit: damlTypes.Text.encode(__typed__.unit),
    };
  },
};
