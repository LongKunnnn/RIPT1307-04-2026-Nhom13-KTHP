import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID của thông báo', example: 1 })
  id!: number; 

  @ApiProperty({ description: 'Loại thông báo', example: 'COMMENT' })
  type!: string; 

  @ApiProperty({ description: 'Tiêu đề thông báo', example: 'Có bình luận mới', nullable: true })
  title!: string | null; 

  @ApiProperty({ description: 'Nội dung chi tiết', example: 'Lê Thanh Quảng đã bình luận...' })
  content!: string; 

  @ApiProperty({ description: 'Đường dẫn để chuyển hướng khi click', nullable: true })
  link_path!: string | null; 

  @ApiProperty({ description: 'Trạng thái đã đọc', example: false })
  is_read!: boolean; 
  @ApiProperty({ description: 'ID của comment liên quan (nếu có)', nullable: true })
  comment_id!: number | null; 

  @ApiProperty({ description: 'Thời gian tạo thông báo' })
  created_at!: Date; 
}