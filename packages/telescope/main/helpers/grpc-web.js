"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grpcWeb = void 0;
exports.grpcWeb = `import { grpc } from "@improbable-eng/grpc-web";

export interface UnaryMethodDefinitionishR
  extends grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

export type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

`;
