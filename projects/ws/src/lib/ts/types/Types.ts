import { T_Signal } from '../common/Enumerations';
import { SignalConnection } from 'typed-signals';
import S_Mouse from '../state/S_Mouse';	

export type Dictionary<T = any> = Record<string, T>;
export type T_Preview_Type = 'image' | 'text' | null;
export type Integer = number & { __brand: 'integer' };
export type Handle_Result<T = Object, U = void> = (result: T) => U;
export type Handle_S_Mouse = Handle_Result<S_Mouse, boolean>;
export type Async_Handle_Boolean = (flag: boolean) => Promise<void>;
export type Signal_Handler = (t_signal: T_Signal, value: any | null) => any;
export type Create_S_Mouse = (event: MouseEvent | null, element: HTMLElement) => S_Mouse;
export type Signal_Signature = (t_signal: T_Signal, priority: number, value: any) => void;
export type SignalConnection_atPriority = { t_signal: T_Signal, priority: number, connection: SignalConnection | null };

