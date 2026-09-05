export interface LifeArea {
  id: string;
  name: string;
  /** Creation order — also picks the auto-assigned display colour. */
  order: number;
  taskCount: number;
}
