angular.module('QuestionCtrl',[])

.controller('QuestionController',['$scope','$cookieStore','$rootScope','$location','$state','$http','$stateParams', 'flash','$modal','appAlert','Answer', 'Question','socket','Notifi',
    function($scope,$cookieStore,$rootScope,$location,$state,$http,$stateParams, flash,$modal,appAlert,Answer, Question, socket,Notifi) {
		$scope.formData = {};
        /*Khi form nhấn submit thì sẽ gửi giữ liệu tới api/questions*/
        $scope.createQuestion = function() {
                $scope.Proccess=true;
                /*Kiểm tra dữ liệu rỗng nếu form rỗng thì không làm gì cả*/
                if (!$.isEmptyObject($scope.formData)) {

                        /*console.log($scope.formData.tag);
                        gọi tới hàm create bên service*/
                        Question.create($scope.formData)
                                .success(function(data) {
                                        $scope.formData = {};
                                        $scope.form.$setPristine();
                                        $scope.Proccess=false;
                                        $('.show-form').fadeOut();
                                        if(!data.status){
                                            flash.success="Câu hỏi của bạn đã được gửi và đang chờ quản trị viên xét duyệt. Cám ơn bạn đã đăng bài.";
                                            $state.go("home");
                                        }
                                        else{
                                            flash.success="Đăng câu hỏi thành công!";
                                            $location.path('/cau-hoi/chi-tiet/'+data._id+'/success');
                                        }
                                });
                }
                else{
                	 	flash.error="Bạn phải điền đầy đủ nội dung";
                        $scope.Proccess=false;
                }
        };
        $scope.upload=function () {
            /*begin modal*/
            var modalInstance = $modal.open({
              templateUrl: '/views/modal/upload.html',
              controller: 'modal.upload',
              backdrop: 'static',
              resolve: {
              }
            });
            modalInstance.result.then(function (dataFromOkModal) {
              console.log(dataFromOkModal);
            }, function (dataFromDissmissModal) {
              console.log(dataFromDissmissModal);
            });
            /*end modal*/
        };
        $scope.chat=function (user) {
            $http.get('/loggedin').success(function(data){
                if(data==='0'){
                    flash.error='Bạn cần đăng nhập để thực hiện hành động này !';
                }
                else{
                    /*begin modal*/
                    var modalInstance = $modal.open({
                      templateUrl: '/views/modal/chat.html',
                      controller: 'modal.chat',
                      backdrop: 'static',
                      resolve: {
                        userData: function () {
                           return user;
                         }
                      }
                    });
                    modalInstance.result.then(function (dataFromOkModal) {
                      console.log(dataFromOkModal);
                    }, function (dataFromDissmissModal) {
                      console.log(dataFromDissmissModal);
                    });
                    /*end modal*/
                }
            });
        };
        $scope.deleteQuestion = function(id,path) {
        appAlert.confirm({title:"Xóa",message:"Bạn chắc chắn muốn xóa câu hỏi này ?"},function(isOk){
            if(isOk){
                Question.delete(id)
                    /*Nếu xóa thành công thì load lại dữ liệu*/
                    .success(function(data) {
                            $http.get('api/question/detail/'+ id)
                            .success(function(data){
                                Notifi.create({userRecive:data.userId._id,userSend:$cookieStore.get('currentUser')._id,content:'Câu hỏi '+data.title+' đã bị quản trị xóa!'});
                                socket.emit('deleteQuestion',{userTitle:data.title,userReciveId:data.userId._id});
                            })
                            .error(function(){
                               console.log("error");
                            });
                            flash.success="Xóa câu hỏi thành công!";
                            $scope.listQuestion=data;
                            $scope.listAdminQuestion=data;
                            $location.path(path);
                    });
            }
            });
        };
        $scope.approve = function(id) {
        appAlert.confirm({title:"Xét duyệt",message:"Bài viết đã duyệt sẽ được hiển thị ngay lập tức lên trang chủ, tiếp tục thao tác?"},function(isOk){
            if(isOk){
                Question.approve(id)
                    /*Nếu duyệt thành công thì load lại dữ liệu*/
                    .success(function(data) {
                        $http.get('api/question/detail/'+ id)
                        .success(function(data){
                            Notifi.create({userRecive:data.userId._id,userSend:$cookieStore.get('currentUser')._id,content:'Câu hỏi '+data.title+' đã được quản trị đăng!'});
                            socket.emit('approve',{userTitle:data.title,userReciveId:data.userId._id});
                        })
                        .error(function(){
                           console.log("error");
                        });
                        flash.success="Đã duyệt thành công bài viết!";
                        $scope.listAdminQuestion=data;
                        $state.go('system-question');
                    });
            }
            });
        };
        $scope.closeForm = function(){
            appAlert.confirm({title:"Xác nhận hủy",message:"Bạn chắc chắn muốn hủy đăng câu hỏi này ?"},function(isOk){
            if(isOk){
                $('.show-form').fadeOut(500);
            }
            });
        };

        $scope.listAllVote=[];
        $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
        $scope.voteUp=function(id){
        $http.get('/loggedin').success(function(isLogin){
            if(isLogin!=='0'){
                $http.get('api/question/vote_up/'+id)
                    .success(function(data){
                        if(parseInt(data)==1)
                            flash.success="Bạn đã BỎ thích câu hỏi này!";
                        else
                            {
                                $http.get('api/question/detail/'+ id)
                                .success(function(data){
                                    Notifi.create({userRecive:data.userId._id,userSend:$cookieStore.get('currentUser')._id,content:$cookieStore.get('currentUser').displayName+' đã thích câu hỏi '+data.title});
                                    socket.emit('voteup',{userSendName:$cookieStore.get('currentUser').displayName,userReciveId:data.userId._id,userTitle:data.title});
                                })
                                .error(function(){
                                console.log("error");
                                });
                                flash.success="Bạn đã thích câu hỏi này!";
                            }
                        Question.get()
                            .success(function(question){
                                $scope.listQuestion= question;
                                $http.get('api/questiontag/getall').success(function(tag){
                                    $scope.listTag=tag;
                                })
                                .error(function(){
                                    console.log('error');
                                });
                            });
                        $http.get('api/question/detail/'+ id)
                            .success(function(data){
                                $scope.questionDetail=data;
                                $scope.formAnswer.question_id=data._id;
                            })
                            .error(function(){
                            console.log("error");
                        });
                        $http.get('api/user/vote')
                            .success(function(vote){
                                $scope.listVote=vote;
                            })
                            .error(function() {
                                console.log('error');
                            });
                        $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
                    })
                    .error(function(){
                        console.log('error');
                    });
            }

            else{
                flash.error='Bạn cần đăng nhập để bình chọn !';
            }
        });
    };
    $scope.voteDown=function(id){
        $http.get('/loggedin').success(function(data){
            if(data!=='0'){
                $http.get('api/question/vote_down/'+id)
                    .success(function(data){
                         if(parseInt(data)==1)
                            flash.success="Bạn đã BỎ không thích câu hỏi này!";
                        else
                            flash.success="Bạn không thích câu hỏi này!";
                        Question.get()
                            .success(function(data){
                                $scope.listQuestion= data;
                                console.log(data);
                                $http.get('api/questiontag/getall').success(function(data){
                                    $scope.listTag=data;
                                })
                                .error(function(){
                                    console.log('error');
                                });
                            });
                        $http.get('api/question/detail/'+ id)
                            .success(function(data){
                                $scope.questionDetail=data;
                                $scope.formAnswer.question_id=data._id;
                            })
                            .error(function(){
                            console.log("error");
                        });
                        $http.get('api/user/vote')
                            .success(function(vote){
                                $scope.listVote=vote;
                            })
                            .error(function() {
                                console.log('error');
                            });
                            $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
                    })
                    .error(function(){
                        console.log('error');
                    });
            }
            else{
                flash.error='Bạn cần đăng nhập để bình chọn !';
            }
        });
    };

    $scope.listFavorite=[];
    $scope.listVote=[];
    if($rootScope.currentUser){
        $http.get('api/user/favorite')
        .success(function(data){
            $scope.listFavorite=data;
        })
        .error(function() {
            console.log('error');
        });
        $http.get('api/user/vote')
        .success(function(vote){
            $scope.listVote=vote;
        })
        .error(function(){
            console.log('error');
        });
    }
    $scope.listAllFavorite=[];
    $http.get('api/user/favorite/all').success(function(all){$scope.listAllFavorite=all;}).error(function(){console.log('error');});
    $scope.Favorite=function(id){
        $http.get('/loggedin').success(function(data){
            if(data!=='0'){
                $http.get('api/question/favorite/'+id)
                    .success(function(favorite){

                        if(parseInt(favorite)==1)
                            flash.success="Bỏ theo dõi thành công!";
                        else
                        {
                            $http.get('api/question/detail/'+ id)
                            .success(function(data){
                                Notifi.create({userRecive:data.userId._id,userSend:$cookieStore.get('currentUser')._id,content:$cookieStore.get('currentUser').displayName+' đã theo dõi câu hỏi '+data.title});
                                    socket.emit('Favorite',{userSendName:$cookieStore.get('currentUser').displayName,userReciveId:data.userId._id,userTitle:data.title});
                            })
                            .error(function(){
                               console.log("error");
                            });
                            flash.success="Bạn đã theo dõi câu hỏi này!";
                        }
                        Question.get()
                            .success(function(question){
                                $scope.listQuestion= question;
                                $http.get('api/questiontag/getall').success(function(tag){
                                    $scope.listTag=tag;
                                })
                                .error(function(){
                                    console.log('error');
                                });
                            });
                        $http.get('api/user/favorite')
                            .success(function(data){
                                $scope.listFavorite=data;
                            })
                            .error(function() {
                                console.log('error');
                            });
                        $http.get('api/user/favorite/all').success(function(all){$scope.listAllFavorite=all;}).error(function(){console.log('error');});
                    })
                    .error(function(){
                        console.log('error');
                    });
            }
            else{
                flash.error='Bạn cần đăng nhập để bình chọn !';
            }
        });
    };
    $scope.listAllAnswer=[];
    $http.get('api/answer').success(function(answer){$scope.listAllAnswer=answer;}).error(function(){console.log('error');});
}])
.controller('ListQuestionController', ['$scope','$http','flash','$location', 'Question',function($scope,$http,flash,$location, Question) {
    $scope.loading=true;
    Question.get()
    .success(function(data){
        $scope.listQuestion= data;
        $scope.loading=false;
        $http.get('api/questiontag/getall').success(function(data){
            $scope.listTag=data;
        })
        .error(function(){
            console.log('error');
        });

        /*Phân trang*/
        $http.get('api/question/count')
            .success(function(data){
                $scope.totalItems=data;
            });
        $scope.currentPage = 1;
        $scope.maxSize = 5;
        $scope.entryLimit = 10;
        /*Hết xử lý phân trang*/
    })
    .error(function(){
        console.log("Error");
    });
    $http.get('api/question/all')
        .success(function(data){
            $scope.listAdminQuestion=data;
        });

}])
.controller('DetailQuestionController',['$scope','$cookieStore','$http', '$state','$stateParams','$location','flash', 'Question', 'Answer','$modal','appAlert','socket','Notifi',
    function($scope,$cookieStore,$http, $state,$stateParams,$location,flash, Question, Answer,$modal,appAlert, socket,Notifi) {
/*Chi tiết câu hỏi*/
$scope.loading=true;
    $scope.formAnswer = {};
    var question_id =$stateParams.id;
    $http.get('api/question/detail/'+ question_id)
        .success(function(data){
            if(!data.status)
                $state.go("404");
            $scope.questionDetail=data;
            $scope.formAnswer.question_id=data._id;
            $scope.questionData=data;
            $scope.loading=false;
        })
        .error(function(){
        console.log("error");
    });
    $http.get('api/findAnswers/'+ question_id)
        .success(function(data){
          $scope.listAnswerQuestion=data;
        })
        .error(function(){
        console.log("error");
    });
    $http.get('api/answer/count/'+question_id)
        .success(function(data){
            $scope.numberAnswer=data;
        })
        .error(function(){
            console.log('error');
        });
    $http.get('api/findTags/'+ question_id).success(function(data){
        $scope.TagQuestion=data;
    })
    .error(function(){
        console.log('error');
    });

    $scope.createAnswer = function(){
            $scope.Proccess=true;
            /*Kiểm tra dữ liệu rỗng nếu form rỗng thì không làm gì cả*/
            if (!$.isEmptyObject($scope.formAnswer)) {

                    Answer.create($scope.formAnswer)
                            .success(function(data) {
                                    $scope.formAnswer.content='';
                                    $scope.Proccess=false;
                                    $('.show-form').fadeOut();
                                    // Notify answer
                                    $http.get('api/question/detail/'+ $scope.formAnswer.question_id)
                                    .success(function(data){
                                       var listAU=[];
                                        $http.get('api/findAnswers/'+data._id)
                                        .success(function(listQA)
                                        {
                                            for(var i in listQA)
                                            {
                                                var item=listQA[i];
                                                if(listAU.indexOf(item.userId._id)==-1 && item.userId._id!=$cookieStore.get('currentUser')._id)
                                                    listAU.push(item.userId._id);
                                            }
                                            for(var i in listAU)
                                            {
                                                var item=listAU[i];
                                                Notifi.create({userRecive:item,userSend:$cookieStore.get('currentUser')._id,content:$cookieStore.get('currentUser').displayName+' đã trả lời câu hỏi '+data.title});
                                            }
                                        });
                                        socket.emit('createAnswer',{userSendName:$cookieStore.get('currentUser').displayName,userReciveId:data.userId._id,userTitle:data.title,userQuestionId:data._id});
                                    })
                                    .error(function(){
                                       console.log("error");
                                    });
                                    flash.success="Gửi trả lời thành công!";
                                    $http.get('api/findAnswers/'+ question_id)
                                        .success(function(data){
                                          $scope.listAnswerQuestion=data;
                                        })
                                        .error(function(){
                                        console.log("error");
                                        });
                                    $http.get('api/answer/count/'+question_id)
                                        .success(function(data){
                                            $scope.numberAnswer=data;
                                        })
                                        .error(function(){
                                            console.log('error');
                                        });
                            });
            }
            else{
                    flash.error="Nội dung trả lời không được để trống.";
                    $scope.Proccess=false;
            }
        };
    $scope.deleteAnswer = function(id) {
        appAlert.confirm({title:"Xóa",message:"Bạn chắc chắn muốn xóa câu trả lời này ?"},function(isOk){
            if(isOk){
                Answer.delete(id)
                    /*Nếu xóa thành công thì load lại dữ liệu*/
                    .success(function(data) {
                        flash.success="Xóa thành công!";
                         $http.get('api/findAnswers/'+ question_id)
                            .success(function(data){
                              $scope.listAnswerQuestion=data;
                            })
                            .error(function(){
                            console.log("error");
                            });
                    });
                }
            });
        };
        $http.get('api/findTags/'+ question_id).success(function(data){
            var a=[];
            for(var i=0; i<data.length; i++){
               var item =data[i].tagId;
                a.push(item.tagName);
            }
            $scope.oldTag=a;
        })
        .error(function(){
            console.log('error');
        });
        $scope.editQuestion = function(){
            $scope.Proccess=true;
            if (!$.isEmptyObject($scope.questionData)) {
                    Question.edit($scope.questionData)
                            .success(function(data) {
                                    /*$scope.questionData = {}; // Xóa form
                                    $scope.edit_question_form.$setPristine();*/
                                    $scope.Proccess=false;
                                    $('.edit_question_form').fadeOut();
                                    flash.success="Sửa câu hỏi thành công!";
                                    $location.path("/question/detail/"+data._id);
                            });
            }
            else{
                    flash.error="Bạn phải điền đầy đủ nội dung.";
                    $scope.Proccess=false;
            }
        };
}])
.controller('CountQuestionController',['$scope','$http', 'Question', function($scope,$http, Question) {
    /*Đếm số câu hỏi trong hệ thống*/
    $http.get('api/question/count')
    .success(function(data){
        $scope.countQuestion=data;
    })
    .error(function(){
        console.log("error");
    });
}])
.controller('PopularQuestionController',['$scope','$http', 'Question', function($scope,$http, Question) {
/*Lấy câu hỏi phổ biến*/
    $scope.popularQuestion=[];
    $http.get('api/question/popular')
    .success(function(data){
      $scope.popularQuestion=data;
    })
    .error(function(){
      console.log('error');
    });
}])
.controller('QuestionDetail',['$scope','$http', '$state','$stateParams','flash', 'Question', function ($scope,$http, $state,$stateParams,flash, Question) {
    var question_id =$stateParams.id;
    $http.get('api/question/detail/'+ question_id)
        .success(function(data){
            $scope.formData=data;
        })
        .error(function(){
        console.log("error");
    });
     $http.get('api/findTags/'+ question_id).success(function(data){
        var a=[];
        for(var i=0; i<data.length; i++){
           var item =data[i].tagId;
            a.push(item.tagName);
        }
        $scope.oldTag=a;
    })
    .error(function(){
        console.log('error');
    });

    $scope.editQuestion = function(){
        $scope.Proccess=true;
            if (!$.isEmptyObject($scope.formData)) {

                    Question.edit($scope.formData)
                            .success(function(data) {
                                    $scope.formData = {};
                                    $scope.form.$setPristine();
                                    $scope.Proccess=false;
                                    flash.success="Sửa câu hỏi thành công!";
                                    $state.go("system-question");
                            });
            }
            else{
                    flash.error="Bạn phải điền đầy đủ nội dung.";
                    $scope.Proccess=false;
            }
    };
}]);