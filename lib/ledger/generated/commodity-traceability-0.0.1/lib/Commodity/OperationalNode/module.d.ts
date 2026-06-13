// Generated from ../../Commodity/OperationalNode/module.daml

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as Commodity_Types from '../../Commodity/Types/module';

export declare type OperationalNodeRef = {
  nodeId: Commodity_Types.OperationalNodeId,
  companyId: Commodity_Types.CompanyId,
  label: string,
}

export declare const OperationalNodeRef:
  damlTypes.Serializable<OperationalNodeRef>
