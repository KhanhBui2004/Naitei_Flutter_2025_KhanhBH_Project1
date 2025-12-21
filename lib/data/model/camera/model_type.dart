// import 'package:ultralytics_yolo/yolo_task.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';

enum ModelType {
  detect('best_float32', YOLOTask.detect);

  final String modelName;

  final YOLOTask task;

  const ModelType(this.modelName, this.task);
}
