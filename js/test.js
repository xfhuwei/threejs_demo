$.each($('.pic img'), function(i,v) {
    var img = new Image();
    img.crossOrigin="anonymous";
    img.src = $(v).attr("src");
    img.onload = function() {
        var canvas=document.getElementById("myCanvas");//获取canvas
        canvas.width=img.width;//设置canvas的宽等于图片的宽
        canvas.height=img.height;//设置canvas的高等于图片的高
        var ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0);//把图片绘制进canvas
        //水印图
        var wenzi=document.getElementById("wenzi");//获取水印canvas
        var ctt=wenzi.getContext("2d");			
        wenzi.width=img.width/5.5;//设置水印图的框
        wenzi.height=wenzi.width;//设置水印图的高
        var zi=wenzi.width/10+'px';//设置水印图的字体大小
        var num=wenzi.width/5+'px';//设置canvas右下角的字体大小
        var nan=wenzi.width/5;//设置水印图右下角的位置比例
        
        //获取图片右下角的背景色
        var pixel = ctx.getImageData(img.width-(nan*4), img.height-nan, 1, 1);
        var data = pixel.data;
        var rgba = 'rgba(' + data[0] + ',' + data[1] +',' + data[2] + ',' + (data[3] / 255) + ')';
        if(data[0]>180 && data[1]>180 && data[2]>180){
            var col='rgba(67,67,67,' + (data[3] / 255) + ')'
        }else{
            var col='rgba(255,255,255,' + (data[3] / 255) + ')'
        }				
        //绘制水印canvas
        ctt.font=""+zi+" myf";				
        ctt.shadowColor="rgba(0, 0, 0, 0.3)";
        ctt.shadowOffsetX=4;
        ctt.shadowOffsetY =6;
        ctt.shadowBlur =2;
        ctt.fillStyle = "rgba(255,255,255,.3)";
        ctt.rotate(-Math.PI/4);
        ctt.fillText("欧模网 www.om.cn",-(wenzi.width/55*24),wenzi.width/55*31,wenzi.width);
        //绘制外层canvas											
        for (var i=0;i<img.width/wenzi.width;i++){
          for (var j=0;j<img.height/wenzi.height;j++){
            ctx.drawImage(wenzi,i*wenzi.width,j*wenzi.height,wenzi.width,wenzi.height);
          }
        }
        ctx.font=""+num+" myf";
        ctx.fillStyle = col;
        ctx.fillText("欧模网",img.width-(nan*4),img.height-2*nan);
        ctx.fillText(id,img.width-(nan*4),img.height-nan,nan*3);
        
        //canvas转化为base64图片并显示
        var image = new Image();			        
        dataURI=image.src = canvas.toDataURL("image/png");
        $('.pic_box').prepend("<img src="+image.src+">");
        
        //上传
        var obj = {
            file: dataURItoBlobWater(dataURI),
            src:dataURI
        };	            	       
        fd.append('pic',obj.file);
        $.ajax({
            type:"POST",
            url:"{$upload_url}",
            async:true,
            headers: {'X-CSRF-TOKEN': LA.token},
            data: fd,
            processData:false,
            contentType:false,		            
            success: function (result) {
                if(result.status == 1){		                    		                    
                    pics.push(result.infos[0]);
                    $("input[name='water']").val(pics);
                    layer.closeAll('loading');
                    toastr.success('生成水印图成功!');
                }else{
                    layer.closeAll('loading');
                    toastr.error('生成失败!');
                }
            },
            error: function (msg) {
                layer.closeAll('loading');
                console.log('生成失败!');
            }
        });
        setTimeout(function(){
            $('.btn.btn-info.pull-right').removeAttr("disabled")
        },5000)						
    }
})
