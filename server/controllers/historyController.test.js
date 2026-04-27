jest.mock('../models/CropData', () => ({
  find: jest.fn()
}));

jest.mock('../models/Appointment', () => ({
  find: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../models/Review', () => ({
  find: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../models/Chat', () => ({
  find: jest.fn(),
  countDocuments: jest.fn()
}));

const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const {
  getAppointmentHistory,
  getChatHistory,
  getReviewHistory
} = require('./historyController');

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

describe('historyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns appointment history scoped to farmer', async () => {
    const req = {
      user: { id: 'farmer-1', role: 'farmer' },
      query: {}
    };
    const res = createResponse();
    const next = jest.fn();
    const appointments = [{ _id: 'appointment-1' }];

    Appointment.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(appointments)
            })
          })
        })
      })
    });
    Appointment.countDocuments.mockResolvedValue(1);

    await getAppointmentHistory(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Appointment.find).toHaveBeenCalledWith({ farmerId: 'farmer-1' });
    expect(res.payload.data).toEqual(appointments);
  });

  test('returns chat history scoped to expert appointment participation', async () => {
    const req = {
      user: { id: 'expert-1', role: 'expert' },
      query: {}
    };
    const res = createResponse();
    const next = jest.fn();
    const messages = [{ _id: 'message-1', appointmentId: 'appointment-1' }];

    Appointment.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'appointment-1' }])
      })
    });

    Chat.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(messages)
          })
        })
      })
    });
    Chat.countDocuments.mockResolvedValue(1);

    await getChatHistory(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Chat.find).toHaveBeenCalledWith({ appointmentId: { $in: ['appointment-1'] } });
    expect(res.payload.data).toEqual(messages);
  });

  test('returns review history scoped to expert', async () => {
    const req = {
      user: { id: 'expert-1', role: 'expert' },
      query: {}
    };
    const res = createResponse();
    const next = jest.fn();
    const reviews = [{ _id: 'review-1', expertId: 'expert-1' }];

    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(reviews)
            })
          })
        })
      })
    });
    Review.countDocuments.mockResolvedValue(1);

    await getReviewHistory(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Review.find).toHaveBeenCalledWith({ expertId: 'expert-1' });
    expect(res.payload.data).toEqual(reviews);
  });
});
