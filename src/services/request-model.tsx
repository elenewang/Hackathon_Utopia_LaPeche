export interface ScanRequest {
    input_value?: string;
    input_value_b?: string;
    output_type: "text";
    input_type: "text";
    tweaks: Record<string, object>;
  }