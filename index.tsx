import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Helper Functions ---
const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// --- Feature Data ---
const features = [
  { id: 'manualApi', title: 'Gọi API Thủ công', description: 'Gửi yêu cầu trực tiếp đến API Gemini để thử nghiệm và khám phá nâng cao.', emoji: '🚀', type: 'manual' },
  { id: 'generate', title: 'Tạo hình ảnh từ văn bản', description: 'Biến ý tưởng của bạn thành hình ảnh độc đáo. Chỉ cần mô tả những gì bạn muốn xem.', emoji: '✨', type: 'generate' },
  { id: 'edit', title: 'Chỉnh sửa ảnh thông minh', description: 'Tải ảnh lên và sử dụng ngôn ngữ tự nhiên để chỉnh sửa một cách chuyên nghiệp.', emoji: '🎨', type: 'edit' },
  { id: 'character', title: 'Thiết kế nhân vật AI', description: 'Tạo các tờ thiết kế nhân vật hoàn chỉnh từ một mô tả đơn giản.', emoji: '👤', type: 'character' },
  { id: 'illustrationToFigure', title: 'Chuyển minh họa thành mô hình', description: 'Biến hình minh họa 2D thành một mô hình nhân vật 3D trông như thật.', emoji: '🗿', type: 'edit' },
  { id: 'mapToScenery', title: 'Sinh cảnh thực tế từ bản đồ', description: 'Tạo ra một khung cảnh ảnh thực từ một bản đồ địa hình hoặc Google Maps.', emoji: '🗺️', type: 'edit' },
  { id: 'arInfo', title: 'Tạo thông tin AR', description: 'Làm nổi bật các điểm ưa thích trong ảnh và chú thích thông tin liên quan.', emoji: '📍', type: 'edit' },
  { id: 'extract3dBuilding', title: 'Trích xuất tòa nhà 3D', description: 'Chuyển đổi ảnh chụp một tòa nhà thành mô hình 3D đẳng cự (isometric).', emoji: '🏢', type: 'edit' },
  { id: 'timeTravelPhoto', title: 'Ảnh du hành thời gian', description: 'Thay đổi phong cách của một người trong ảnh sang một thời đại khác.', emoji: '⏳', type: 'edit' },
  { id: 'multiRefGen', title: 'Tạo ảnh đa tham chiếu', description: 'Tổng hợp nhiều hình ảnh và mô tả văn bản để tạo ra một cảnh thống nhất.', emoji: '🧩', type: 'edit' },
  { id: 'autoEnhance', title: 'Chỉnh sửa ảnh tự động', description: 'Nâng cao ảnh của bạn: tăng độ tương phản, màu sắc và ánh sáng.', emoji: '🪄', type: 'edit' },
  { id: 'multiPoseControl', title: 'Điều khiển tư thế nhiều nhân vật', description: 'Dàn dựng cảnh chiến đấu giữa hai nhân vật bằng cách sử dụng hình vẽ que làm tư thế.', emoji: '🤺', type: 'edit' },
  { id: 'crossViewGen', title: 'Tạo hình ảnh chéo', description: 'Chuyển đổi một bức ảnh từ góc nhìn ngang sang góc nhìn từ trên xuống.', emoji: '🔄', type: 'edit' },
  { id: 'customSticker', title: 'Nhãn dán nhân vật tùy chỉnh', description: 'Biến một nhân vật thành một nhãn dán có viền trắng theo phong cách minh họa.', emoji: '🏷️', type: 'edit' },
  { id: 'animeToCosplay', title: 'Từ Anime đến Cosplay', description: 'Tạo ra một bức ảnh chụp một người đang cosplay một nhân vật anime.', emoji: '🎭', type: 'edit' },
  { id: 'colorLineArt', title: 'Tô màu theo bảng màu', description: 'Sử dụng một bảng màu cho trước để tô màu chính xác cho một bức tranh vẽ nét.', emoji: '🎨', type: 'edit' },
  { id: 'infographicArticle', title: 'Đồ họa thông tin bài viết', description: 'Tạo một infographic tóm tắt nội dung của một bài báo hoặc văn bản.', emoji: '📊', type: 'generate' },
  { id: 'changeHairstyle', title: 'Thay đổi nhiều kiểu tóc', description: 'Tạo ra các avatar của một người với nhiều kiểu tóc khác nhau.', emoji: '💇', type: 'edit' },
  { id: 'annotatedDiagram', title: 'Sơ đồ chú thích', description: 'Vẽ một mô hình 3D của một cơ quan hoặc vật thể với các chú thích giải thích.', emoji: '🫀', type: 'generate' },
  { id: 'marbleSculpture', title: 'Điêu khắc đá cẩm thạch', description: 'Tạo một hình ảnh siêu thực về một tác phẩm điêu khắc bằng đá cẩm thạch.', emoji: '🏛️', type: 'edit' },
  { id: 'cookFromIngredients', title: 'Nấu ăn theo nguyên liệu', description: 'Tạo ra một món ăn ngon miệng từ hình ảnh các nguyên liệu có sẵn.', emoji: '🍳', type: 'edit' },
  { id: 'solveMath', title: 'Giải toán trên ảnh', description: 'Viết câu trả lời cho một bài toán hình học ngay trên hình ảnh đề bài.', emoji: '📐', type: 'edit' },
  { id: 'colorize', title: 'Tô màu ảnh cũ', description: 'Thổi sức sống mới vào những kỷ niệm xưa bằng cách tô màu cho các bức ảnh đen trắng.', emoji: '🖼️', type: 'edit' },
  { id: 'ootd', title: 'Tạo trang phục OOTD', description: 'Mặc cho một người trong ảnh các bộ quần áo và phụ kiện từ một hình ảnh khác.', emoji: '👗', type: 'edit' },
  { id: 'changeClothes', title: 'Thay đổi quần áo', description: 'Thay thế quần áo của một người bằng một bộ trang phục khác mà không thay đổi gì khác.', emoji: '👕', type: 'edit' },
  { id: 'multiView', title: 'Tạo nhiều góc nhìn', description: 'Tạo ra các góc nhìn trước, sau, trái, phải, trên, dưới của một đối tượng.', emoji: '🎲', type: 'edit' },
  { id: 'filmStoryboard', title: 'Tạo kịch bản phim ảnh', description: 'Kể một câu chuyện 12 phần bằng 12 hình ảnh theo phong cách phim noir.', emoji: '🎬', type: 'generate' },
  { id: 'modifyPose', title: 'Sửa đổi tư thế', description: 'Thay đổi tư thế của người trong ảnh, ví dụ như để họ nhìn thẳng về phía trước.', emoji: '🧍', type: 'edit' },
  { id: 'imageFromLineArt', title: 'Ảnh từ bản vẽ nét', description: 'Thay đổi tư thế của một người theo một bản vẽ đường nét và chụp trong studio.', emoji: '✍️', type: 'edit' },
  { id: 'addWatermark', title: 'Thêm hình mờ', description: 'Thêm một từ lặp đi lặp lại trên toàn bộ hình ảnh làm hình mờ.', emoji: '™️', type: 'edit' },
  { id: 'infographicWorld', title: 'Infographic thế giới', description: 'Tạo infographic về 5 tòa nhà cao nhất thế giới hoặc những thứ ngọt ngào nhất.', emoji: '🌍', type: 'generate' },
  { id: 'redPen', title: 'Chú thích bằng bút đỏ', description: 'Phân tích một hình ảnh và dùng bút đỏ để chỉ ra những điểm cần cải thiện.', emoji: '🖍️', type: 'edit' },
  { id: 'explodingFood', title: 'Thực phẩm "bùng nổ"', description: 'Chụp ảnh sản phẩm với các nguyên liệu bay xung quanh một cách ấn tượng.', emoji: '💥', type: 'generate' },
  { id: 'createComic', title: 'Tạo truyện tranh', description: 'Dựa trên một hình ảnh, tạo ra một dải truyện tranh siêu anh hùng có lời thoại.', emoji: '💬', type: 'edit' },
  { id: 'actionFigure', title: 'Tạo nhân vật hành động', description: 'Tạo một mô hình nhân vật hành động của bạn với các phụ kiện đi kèm.', emoji: '🤖', type: 'edit' },
  { id: 'mapToIsometric', title: 'Bản đồ sang Isometric', description: 'Lấy một địa điểm trên bản đồ và biến nó thành một công trình isometric.', emoji: '🏰', type: 'edit' },
  { id: 'controlExpression', title: 'Điều khiển biểu cảm', description: 'Thay đổi biểu cảm của nhân vật trong Hình 1 theo biểu cảm trong Hình 2.', emoji: '😊', type: 'edit' },
  { id: 'fourPanelDraw', title: 'Quy trình vẽ 4 bước', description: 'Tạo ra quy trình vẽ một nhân vật qua 4 bước: vẽ nét, tô màu phẳng, đổ bóng, hoàn thiện.', emoji: '📄', type: 'edit' },
  { id: 'virtualMakeup', title: 'Thử trang điểm ảo', description: 'Áp dụng phong cách trang điểm từ một hình ảnh lên một nhân vật khác.', emoji: '💄', type: 'edit' },
  { id: 'makeupAnalysis', title: 'Phân tích trang điểm', description: 'Dùng bút đỏ để đánh dấu các khu vực trên khuôn mặt có thể cải thiện bằng trang điểm.', emoji: '🧐', type: 'edit' },
  { id: 'middleEarthMaps', title: 'Google Maps Trung Địa', description: 'Tạo một cảnh Google Street View ở Hobbiton với các hobbit đang sinh hoạt.', emoji: '🏞️', type: 'generate' },
  { id: 'typographicIllustration', title: 'Minh họa chữ', description: 'Tạo một cảnh chỉ bằng cách sử dụng các chữ cái từ một cụm từ.', emoji: '🅰️', type: 'generate' },
  { id: 'createPoseSheet', title: 'Tạo bảng tư thế', description: 'Tạo một bảng tư thế (pose sheet) cho một nhân vật với nhiều tư thế khác nhau.', emoji: '💃', type: 'edit' },
  { id: 'productPackaging', title: 'Thiết kế bao bì', description: 'Áp dụng một thiết kế lên một lon nước và đặt nó trong một bối cảnh tối giản.', emoji: '🥫', type: 'edit' },
  { id: 'overlayFilter', title: 'Phủ bộ lọc/vật liệu', description: 'Phủ một hiệu ứng (ví dụ: kính) từ hình ảnh này lên một hình ảnh khác.', emoji: '✨', type: 'edit' },
  { id: 'controlFaceShape', title: 'Điều khiển hình dạng khuôn mặt', description: 'Thiết kế một nhân vật theo phiên bản chibi dựa trên hình dạng khuôn mặt cho trước.', emoji: '👶', type: 'edit' },
  { id: 'lightingControl', title: 'Kiểm soát ánh sáng', description: 'Thay đổi ánh sáng trên một nhân vật để khớp với một sơ đồ ánh sáng khác.', emoji: '💡', type: 'edit' },
  { id: 'legoMinifig', title: 'Mô hình LEGO', description: 'Biến một người thành một mô hình LEGO, bao gồm cả hộp và mô hình thực tế.', emoji: '🧱', type: 'edit' },
  { id: 'gundamModel', title: 'Mô hình Gundam', description: 'Biến một người thành một bộ mô hình Gundam, bao gồm hộp và mô hình lắp ráp.', emoji: '🤖', type: 'edit' },
  { id: 'explodedView', title: 'Chế độ xem bung lụa', description: 'Tạo một chế độ xem "nổ tung" của một thiết bị, hiển thị tất cả các thành phần bên trong.', emoji: '🔩', type: 'generate' },
  { id: 'calorieAnnotation', title: 'Chú thích calo', description: 'Chú thích một bữa ăn với tên các món ăn, mật độ calo và lượng calo gần đúng.', emoji: '🥗', type: 'edit' },
  { id: 'extractSubject', title: 'Trích xuất chủ thể', description: 'Trích xuất một chủ thể (ví dụ: samurai) và đặt trên nền trong suốt.', emoji: '✂️', type: 'edit' },
  { id: 'inpaint', title: 'Sửa chữa ảnh', description: 'Sửa chữa các phần bị thiếu (trong suốt) của một hình ảnh để tạo ra một bức ảnh hoàn chỉnh.', emoji: '🩹', type: 'edit' },
  { id: 'oldMapToPhoto', title: 'Bản đồ cổ sang ảnh thật', description: 'Biến một bản đồ cổ thành một bức ảnh màu hiện đại như thể được chụp ngày nay.', emoji: '📜', type: 'edit' },
  { id: 'fashionMoodboard', title: 'Moodboard thời trang', description: 'Tạo một moodboard thời trang với các mục quần áo, ghi chú viết tay và bản phác thảo.', emoji: '🗒️', type: 'edit' },
  { id: 'cuteProductPhoto', title: 'Chụp ảnh sản phẩm nhỏ', description: 'Tạo một bức ảnh quảng cáo độ phân giải cao của một sản phẩm thu nhỏ.', emoji: '🤏', type: 'generate' },
  { id: 'animeStatueInReal', title: 'Tượng Anime ngoài đời thực', description: 'Đặt một bức tượng khổng lồ của một nhân vật anime vào giữa một thành phố.', emoji: '🗼', type: 'edit' },
  { id: 'itashaCar', title: 'Tạo xe Itasha', description: 'Tạo một bức ảnh chuyên nghiệp về một chiếc xe thể thao được trang trí theo phong cách anime.', emoji: '🚗', type: 'edit' },
  { id: 'createManga', title: 'Sáng tác Manga', description: 'Tạo ra một cảnh truyện manga đen trắng từ một bản phác thảo có hướng dẫn.', emoji: '📖', type: 'edit' },
  { id: 'mangaStyle', title: 'Chuyển đổi phong cách Manga', description: 'Biến những bức ảnh đời thực thành các trang truyện tranh đen trắng ấn tượng.', emoji: '✒️', type: 'edit' },
  { id: 'holographicWireframe', title: 'Khung dây Hologram', description: 'Chuyển đổi một hình ảnh thành một hình ba chiều chỉ sử dụng các đường khung dây.', emoji: '🌐', type: 'edit' },
  { id: 'minecraftStyle', title: 'Phong cách Minecraft', description: 'Sử dụng một địa điểm để tạo ra một hình ảnh HD-2D isometric của công trình theo phong cách Minecraft.', emoji: '🟩', type: 'edit' },
  { id: 'applyMaterialToLogo', title: 'Áp vật liệu cho Logo', description: 'Áp dụng vật liệu từ một hình ảnh lên logo và hiển thị nó dưới dạng đối tượng 3D.', emoji: '🌟', type: 'edit' },
  { id: '3dFloorPlan', title: 'Bản vẽ mặt bằng 3D', description: 'Chuyển đổi một sơ đồ mặt bằng 2D thành một bản render 3D isometric, ảnh thực.', emoji: '🏠', type: 'edit' },
  { id: 'setCameraParams', title: 'Đặt lại thông số máy ảnh', description: 'Áp dụng các cài đặt máy ảnh cụ thể (ISO, khẩu độ, tiêu cự) vào một bức ảnh.', emoji: '📷', type: 'edit' },
  { id: 'createIdPhoto', title: 'Tạo ảnh ID', description: 'Cắt đầu và tạo ảnh ID 2 inch với nền xanh, trang phục công sở.', emoji: '🆔', type: 'edit' },
  { id: 'a6FoldingCard', title: 'Thiết kế thẻ gấp A6', description: 'Vẽ một tấm thiệp gấp A6, khi mở ra sẽ lộ ra một ngôi nhà 3D và khu vườn thu nhỏ.', emoji: '💌', type: 'edit' },
  { id: 'designChessSet', title: 'Thiết kế bộ cờ vua', description: 'Vẽ một bàn cờ và một bộ quân cờ 3D có thể in được lấy cảm hứng từ một hình ảnh.', emoji: '♟️', type: 'edit' },
  { id: 'splitContrast', title: 'Ảnh tương phản tách đôi', description: 'Tạo một bức ảnh phòng ngủ bị tách đôi: một nửa là năm 2018, nửa còn lại là năm 1964.', emoji: '🌗', type: 'generate' },
  { id: 'jewelryCollection', title: 'Thiết kế bộ sưu tập trang sức', description: 'Biến một hình ảnh thành một bộ sưu tập trang sức 5 món.', emoji: '💎', type: 'edit' },
  { id: 'merchandise', title: 'Thiết kế hàng hóa', description: 'Tự động tạo các mẫu áo, cốc, và mũ từ hình ảnh nhân vật của bạn.', emoji: '🛍️', type: 'edit' },
];


// --- SVG Icons ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Loader = () => (
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
    <p className="text-slate-600">Đang xử lý...</p>
  </div>
);

// --- API Key Input Component ---
const ApiKeyForm = ({ onSubmit }) => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!key.trim()) {
            setError('Vui lòng nhập API Key của bạn.');
            return;
        }
        setLoading(true);
        setError('');
        const success = await onSubmit(key);
        if (!success) {
            setError('API Key không hợp lệ hoặc đã xảy ra lỗi. Vui lòng kiểm tra lại.');
            setLoading(false);
        }
        // On success, the component will be unmounted, so no need to reset loading state.
    };

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-6 mb-8 rounded-r-lg shadow-md">
            <h3 className="font-bold text-xl mb-2">Yêu cầu cấu hình API Key</h3>
            <p className="mb-4">
                Để sử dụng ứng dụng, vui lòng nhập Google AI API Key của bạn vào ô bên dưới.
                Bạn có thể lấy key tại{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-amber-900">
                    Google AI Studio
                </a>.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start gap-2">
                <div className="w-full">
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Dán API Key của bạn vào đây"
                        className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        aria-label="Google AI API Key"
                    />
                    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-yellow-500 text-white font-bold py-2 px-6 rounded-md hover:bg-yellow-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition whitespace-nowrap"
                >
                    {loading ? 'Đang kiểm tra...' : 'Lưu & Bắt đầu'}
                </button>
            </form>
            <p className="text-xs mt-3 text-slate-500">
                Key của bạn chỉ được lưu trong phiên truy cập này trên trình duyệt của bạn và không được gửi đi bất cứ đâu ngoài Google AI.
            </p>
        </div>
    );
};

// --- Reusable Components ---
const Modal = ({ children = null, onClose, title }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-3xl m-4 modal-content overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
        <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition" aria-label="Đóng modal">
          <CloseIcon />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const ImageInput = ({ onImageChange }) => {
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onImageChange(e.target.files[0]);
        }
    };

    const handleDragEvents = (e, isDragging) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(isDragging);
    };

    const handleDrop = (e) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageChange(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-yellow-500 bg-yellow-50' : 'border-slate-300 hover:border-yellow-400'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDragOver={(e) => handleDragEvents(e, true)}
            onDrop={handleDrop}
        >
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <p className="text-slate-500">Kéo và thả ảnh vào đây, hoặc nhấn để chọn</p>
            <p className="text-sm text-slate-400 mt-1">Hỗ trợ PNG, JPG, WEBP</p>
        </div>
    );
};


// --- Feature Modals ---
const ImageGenerateModal = ({ onClose, title, onSuccess, ai }) => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!prompt) {
            setError('Vui lòng nhập mô tả.');
            return;
        }
        setLoading(true);
        setError('');
        setImage('');
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setImage(`data:image/jpeg;base64,${base64ImageBytes}`);
            onSuccess();
        } catch (e) {
            console.error("Lỗi tạo ảnh:", e);
            const detailedMessage = e instanceof Error ? e.message : 'Lỗi không xác định.';
            setError(`Đã xảy ra lỗi khi tạo ảnh. Chi tiết: ${detailedMessage}. Vui lòng kiểm tra lại API Key và thử lại.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title={title}>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Một chú mèo phi hành gia đang lướt sóng trên dải ngân hà..."
                    className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                    aria-label="Mô tả hình ảnh"
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-slate-300 transition"
                >
                    {loading ? 'Đang tạo...' : 'Tạo ảnh'}
                </button>
                {error && <p className="text-red-500 break-words">{error}</p>}
                {loading && <Loader />}
                {image && (
                    <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                        <img src={image} alt="Generated image" className="rounded-md max-w-full mx-auto" />
                         <a href={image} download="generated-image.jpg" className="mt-4 inline-block bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition w-full text-center">Tải xuống</a>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const ImageEditModal = ({ onClose, title, onSuccess, ai }) => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState(null);
    const [originalImageURL, setOriginalImageURL] = useState('');
    const [editedImage, setEditedImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (file) => {
        setOriginalImage(file);
        setOriginalImageURL(URL.createObjectURL(file));
        setEditedImage('');
    };

    const handleSubmit = async () => {
        if (!originalImage || !prompt) {
            setError('Vui lòng tải ảnh lên và nhập lời nhắn chỉnh sửa.');
            return;
        }
        setLoading(true);
        setError('');
        setEditedImage('');

        try {
            const imagePart = await fileToGenerativePart(originalImage);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            
            const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            const textResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.text);

            if (imageResponsePart?.inlineData) {
                const { data, mimeType } = imageResponsePart.inlineData;
                setEditedImage(`data:${mimeType};base64,${data}`);
                onSuccess();
            } else {
                 const reason = textResponsePart ? `Phản hồi từ AI: "${textResponsePart.text}"` : 'Hãy thử một lời nhắc khác hoặc kiểm tra lại ảnh đầu vào.';
                 setError(`Không thể tạo ảnh đã chỉnh sửa. ${reason}`);
            }
        } catch (e) {
            console.error("Lỗi chỉnh sửa ảnh:", e);
            const detailedMessage = e instanceof Error ? e.message : 'Lỗi không xác định.';
            setError(`Đã xảy ra lỗi khi chỉnh sửa ảnh. Chi tiết: ${detailedMessage}. Vui lòng kiểm tra lại API Key và thử lại.`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal onClose={onClose} title={title}>
            <div className="space-y-4">
                {!originalImageURL && <ImageInput onImageChange={handleImageChange} />}
                {originalImageURL && (
                     <div className="text-center">
                        <img src={originalImageURL} alt="Original" className="max-w-xs mx-auto rounded-lg shadow-md" />
                        <button onClick={() => { setOriginalImage(null); setOriginalImageURL(''); }} className="mt-2 text-sm text-yellow-600 hover:underline">Thay đổi ảnh</button>
                    </div>
                )}
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Biến nền thành một bãi biển hoàng hôn..."
                    className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                    aria-label="Lời nhắn chỉnh sửa"
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading || !originalImage}
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-slate-300 transition"
                >
                    {loading ? 'Đang chỉnh sửa...' : 'Chỉnh sửa'}
                </button>
                {error && <p className="text-red-500 break-words">{error}</p>}
                {loading && <Loader />}
                {editedImage && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-center">Kết quả</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-center mb-2">Ảnh gốc</h4>
                                <img src={originalImageURL} alt="Original" className="rounded-lg shadow-md w-full" />
                            </div>
                            <div>
                                <h4 className="font-medium text-center mb-2">Đã chỉnh sửa</h4>
                                <img src={editedImage} alt="Edited" className="rounded-lg shadow-md w-full" />
                            </div>
                        </div>
                        <a href={editedImage} download="edited-image.png" className="mt-4 inline-block bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition w-full text-center">Tải xuống kết quả</a>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const CharacterCreatorModal = ({ onClose, title, onSuccess, ai }) => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!prompt) {
            setError('Vui lòng nhập mô tả nhân vật.');
            return;
        }
        setLoading(true);
        setError('');
        setImage('');
        try {
            const fullPrompt = `Generate a character design sheet in anime style for this character: ${prompt}. Include: a main full-body pose, three views (front, side, back), an expression sheet with 4 common expressions. Clean white background.`;
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '3:4' },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setImage(`data:image/jpeg;base64,${base64ImageBytes}`);
            onSuccess();
        } catch (e) {
            console.error("Lỗi tạo nhân vật:", e);
            const detailedMessage = e instanceof Error ? e.message : 'Lỗi không xác định.';
            setError(`Đã xảy ra lỗi khi tạo nhân vật. Chi tiết: ${detailedMessage}. Vui lòng kiểm tra lại API Key và thử lại.`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal onClose={onClose} title={title}>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Một nữ kiếm sĩ với mái tóc bạc dài, mặc áo giáp nhẹ màu xanh đậm, đôi mắt màu hổ phách..."
                    className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                    aria-label="Mô tả nhân vật"
                />
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-slate-300 transition"
                >
                    {loading ? 'Đang tạo...' : 'Tạo nhân vật'}
                </button>
                {error && <p className="text-red-500 break-words">{error}</p>}
                {loading && <Loader />}
                {image && (
                    <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                        <img src={image} alt="Generated character sheet" className="rounded-md max-w-full mx-auto" />
                         <a href={image} download="character-sheet.jpg" className="mt-4 inline-block bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition w-full text-center">Tải xuống</a>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const ManualApiModal = ({ onClose, title, apiKey, onSuccess }) => {
    const defaultBody = JSON.stringify({
        "contents": [{
            "parts": [{
                "text": "Explain how AI works in a few words"
            }]
        }]
    }, null, 2);

    const [requestBody, setRequestBody] = useState(defaultBody);
    const [responseBody, setResponseBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        let parsedBody;
        try {
            parsedBody = JSON.parse(requestBody);
        } catch (e) {
            setError('Nội dung yêu cầu không phải là JSON hợp lệ.');
            return;
        }

        setLoading(true);
        setError('');
        setResponseBody('');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey,
                },
                body: JSON.stringify(parsedBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || `Lỗi HTTP: ${response.status}`);
            }
            
            setResponseBody(JSON.stringify(data, null, 2));
            onSuccess();
        } catch (e) {
            console.error(e);
            setError(`Đã xảy ra lỗi: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title={title}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="request-body" className="block text-sm font-medium text-slate-700 mb-1">
                        Nội dung Yêu cầu (JSON)
                    </label>
                    <textarea
                        id="request-body"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder="Nhập nội dung JSON vào đây..."
                        className="w-full h-48 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400 font-mono text-sm bg-slate-50"
                        aria-label="Nội dung yêu cầu JSON"
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-slate-300 transition"
                >
                    {loading ? 'Đang gửi...' : 'Gửi Yêu cầu'}
                </button>
                {error && <p className="text-red-500 text-sm break-words">{error}</p>}
                {loading && <Loader />}
                {responseBody && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Phản hồi</h3>
                        <pre className="bg-slate-100 p-4 rounded-md text-sm overflow-x-auto">
                            <code>{responseBody}</code>
                        </pre>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const DonationModal = ({ onClose }) => (
    <Modal onClose={onClose} title="Mời tôi một ly Cafe ☕">
        <div className="text-center space-y-4">
            <p className="text-lg text-slate-700">Nếu thấy vui hãy mời tôi 1 ly Cafe:</p>
            <div className="bg-slate-100 p-4 rounded-lg">
                <p className="font-bold text-xl text-slate-800">MB Bank</p>
                <p className="text-2xl font-mono tracking-wider text-yellow-600">0917939111</p>
                <p className="font-semibold">DUONG TIEN DUNG</p>
            </div>
             <button 
                onClick={onClose}
                className="w-full bg-slate-500 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-600 transition"
            >
                Bỏ qua
            </button>
        </div>
    </Modal>
);

// --- Main App Components ---
const Header = () => (
    <header className="text-center py-10 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 tracking-tight">
            NANO BANANA <span className="text-slate-800">AI</span>
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-600">
            Khám phá 68+ tính năng AI minh họa để sáng tạo không giới hạn.
        </p>
    </header>
);

const FeatureCard = (props) => (
    <div 
        className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
        onClick={() => props.onSelect(props.feature)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && props.onSelect(props.feature)}
    >
        <span className="text-4xl mb-4">{props.feature.emoji}</span>
        <h3 className="font-bold text-lg text-slate-800">{props.feature.title}</h3>
        <p className="text-slate-500 text-sm mt-2 flex-grow">{props.feature.description}</p>
        <button className="mt-4 bg-yellow-100 text-yellow-800 font-semibold py-2 px-4 rounded-full text-sm hover:bg-yellow-200 transition-colors">
            Thử ngay
        </button>
    </div>
);


const App = () => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [creationCount, setCreationCount] = useState(0);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [ai, setAi] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API key can be in process.env.API_KEY
    if (process.env.API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setAi(genAI);
        setApiKey(process.env.API_KEY);
      } catch (e) {
        console.error("Lỗi khởi tạo GoogleGenAI từ biến môi trường:", e);
        // Let the user input manually if env var is invalid
      }
    }
    setIsLoading(false);
  }, []);
  
  const handleApiKeySubmit = async (key) => {
    try {
      const genAI = new GoogleGenAI({ apiKey: key });
      // Quick test call to validate the key with a harmless query
      await genAI.models.generateContent({model: 'gemini-2.5-flash', contents: 'hi'});
      setAi(genAI);
      setApiKey(key);
      return true;
    } catch (e) {
      console.error('Lỗi khi thiết lập API key:', e);
      setAi(null);
      setApiKey('');
      return false;
    }
  };

  const handleSelectFeature = (feature) => {
    if (!ai) return;
    setActiveFeature(feature);
  };
  
  const handleCloseModal = () => {
    setActiveFeature(null);
  };

  const handleCreationSuccess = () => {
    const newCount = creationCount + 1;
    setCreationCount(newCount);
    if (newCount === 3) {
        setShowDonationModal(true);
    }
  };
  
  const renderModal = () => {
    if (!activeFeature || !ai) return null;

    const props = { 
        onClose: handleCloseModal, 
        title: activeFeature.title,
        onSuccess: handleCreationSuccess,
        ai: ai,
        apiKey: apiKey,
    };

    switch (activeFeature.type) {
      case 'generate':
        return <ImageGenerateModal {...props} />;
      case 'edit':
        return <ImageEditModal {...props} />;
      case 'character':
        return <CharacterCreatorModal {...props} />;
      case 'manual':
        return <ManualApiModal {...props} />;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader />
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {!ai && <ApiKeyForm onSubmit={handleApiKeySubmit} />}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${!ai ? 'opacity-50 pointer-events-none' : ''}`}>
          {features.map(feature => (
            <FeatureCard key={feature.id} feature={feature} onSelect={handleSelectFeature} />
          ))}
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-slate-500 border-t space-y-3">
        <p>Lấy cảm hứng từ Awesome Nano Banana Images trên Github</p>
        <p className="font-semibold">©DƯƠNG TIẾN DŨNG ☎️ 0917.939.111</p>
        <div>
            <a 
                href="https://zalo.me/g/xxgxqm429" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition"
            >
                Tham gia nhóm để được hỗ trợ
            </a>
        </div>
      </footer>
      {renderModal()}
      {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);